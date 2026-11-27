package com.quickrider.service.impl;

import com.quickrider.dto.request.CartItemRequest;
import com.quickrider.dto.request.CartValidationRequest;
import com.quickrider.dto.request.OrderStatusUpdateRequest;
import com.quickrider.dto.request.PlaceOrderRequest;
import com.quickrider.dto.response.CartLineResponse;
import com.quickrider.dto.response.CartValidationResponse;
import com.quickrider.dto.response.OrderResponse;
import com.quickrider.dto.response.PageResponse;
import com.quickrider.entity.Address;
import com.quickrider.entity.Order;
import com.quickrider.entity.OrderItem;
import com.quickrider.entity.Product;
import com.quickrider.entity.Shop;
import com.quickrider.entity.User;
import com.quickrider.entity.enums.OrderStatus;
import com.quickrider.entity.enums.PaymentMethod;
import com.quickrider.entity.enums.PaymentStatus;
import com.quickrider.event.OrderEvent;
import com.quickrider.exception.BadRequestException;
import com.quickrider.exception.ResourceNotFoundException;
import com.quickrider.mapper.DtoMapper;
import com.quickrider.repository.AddressRepository;
import com.quickrider.repository.OrderRepository;
import com.quickrider.repository.ProductRepository;
import com.quickrider.repository.ShopRepository;
import com.quickrider.repository.UserRepository;
import com.quickrider.service.OrderService;
import com.quickrider.service.ShopService;
import com.quickrider.util.BusinessClock;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collection;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private static final int MAX_UNITS_PER_ITEM = 50;
    private static final String ORDER_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final Map<OrderStatus, String> DEFAULT_NOTES = new EnumMap<>(OrderStatus.class);

    static {
        DEFAULT_NOTES.put(OrderStatus.AWAITING_PAYMENT, "Waiting for online payment");
        DEFAULT_NOTES.put(OrderStatus.PLACED, "Order placed");
        DEFAULT_NOTES.put(OrderStatus.ACCEPTED, "Order accepted by shop");
        DEFAULT_NOTES.put(OrderStatus.PACKING, "Packing your items");
        DEFAULT_NOTES.put(OrderStatus.OUT_FOR_DELIVERY, "Rider is on the way");
        DEFAULT_NOTES.put(OrderStatus.DELIVERED, "Delivered");
        DEFAULT_NOTES.put(OrderStatus.CANCELLED, "Order cancelled");
    }

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final ShopRepository shopRepository;
    private final AddressRepository addressRepository;
    private final UserRepository userRepository;
    private final ShopService shopService;
    private final BusinessClock clock;
    private final ApplicationEventPublisher events;

    // =====================================================================
    // Customer
    // =====================================================================

    @Override
    @Transactional(readOnly = true)
    public CartValidationResponse validateCart(CartValidationRequest request) {
        Shop shop = shopRepository.findByIdAndActiveTrue(request.shopId())
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found or currently unavailable"));
        Map<Long, Integer> quantities = mergeQuantities(request.items());
        Map<Long, Product> products = productRepository.findByIdInAndShopId(quantities.keySet(), shop.getId())
                .stream().collect(Collectors.toMap(Product::getId, Function.identity()));

        List<CartLineResponse> lines = new ArrayList<>();
        List<String> messages = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        boolean valid = true;

        for (Map.Entry<Long, Integer> entry : quantities.entrySet()) {
            Long productId = entry.getKey();
            int requested = entry.getValue();
            Product product = products.get(productId);
            if (product == null) {
                lines.add(new CartLineResponse(productId, null, null, requested, 0, null, BigDecimal.ZERO,
                        false, "This item is not sold by " + shop.getName()));
                valid = false;
                continue;
            }
            String problem = stockProblem(product, requested);
            BigDecimal lineTotal = product.effectivePrice().multiply(BigDecimal.valueOf(requested));
            if (problem == null) {
                subtotal = subtotal.add(lineTotal);
            } else {
                valid = false;
            }
            lines.add(new CartLineResponse(product.getId(), product.getName(), product.getUnit(), requested,
                    product.isAvailable() ? product.getStockQuantity() : 0, product.effectivePrice(), lineTotal,
                    problem == null, problem));
        }

        boolean open = clock.isOpenNow(shop);
        if (!open) {
            valid = false;
            messages.add(shop.getName() + " is closed right now. It opens at " + shop.getOpeningTime() + ".");
        }
        if (subtotal.compareTo(shop.getMinOrderAmount()) < 0) {
            valid = false;
            messages.add("Minimum order value for this shop is Rs. " + shop.getMinOrderAmount() + ".");
        }
        BigDecimal deliveryFee = shop.getDeliveryFee();
        return new CartValidationResponse(shop.getId(), shop.getName(), open, valid, lines, subtotal,
                deliveryFee, subtotal.add(deliveryFee), shop.getMinOrderAmount(), messages);
    }

    @Override
    @Transactional
    public OrderResponse placeOrder(Long customerId, PlaceOrderRequest request) {
        Shop shop = shopRepository.findByIdAndActiveTrue(request.shopId())
                .orElseThrow(() -> new BadRequestException("This shop is not accepting orders right now"));
        if (!clock.isOpenNow(shop)) {
            throw new BadRequestException(shop.getName() + " is closed right now. It opens at " + shop.getOpeningTime() + ".");
        }
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> ResourceNotFoundException.of("User", customerId));
        Address address = addressRepository.findByIdAndUserId(request.addressId(), customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery address not found"));
        String phone = StringUtils.hasText(request.contactPhone()) ? request.contactPhone().trim() : customer.getPhone();
        if (!StringUtils.hasText(phone)) {
            throw new BadRequestException("Please provide a contact phone number for delivery");
        }

        Map<Long, Integer> quantities = mergeQuantities(request.items());
        List<Product> locked = productRepository.lockForCheckout(quantities.keySet(), shop.getId());
        if (locked.size() != quantities.size()) {
            throw new BadRequestException("Some items in your cart are no longer sold by this shop. Please review your cart.");
        }

        Order order = new Order();
        BigDecimal subtotal = BigDecimal.ZERO;
        for (Product product : locked) {
            int qty = quantities.get(product.getId());
            String problem = stockProblem(product, qty);
            if (problem != null) {
                throw new BadRequestException(product.getName() + " (" + product.getUnit() + "): " + problem);
            }
            product.setStockQuantity(product.getStockQuantity() - qty);

            BigDecimal unitPrice = product.effectivePrice();
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(qty));
            OrderItem item = new OrderItem();
            item.setProduct(product);
            item.setProductName(product.getName());
            item.setUnit(product.getUnit());
            item.setUnitPrice(unitPrice);
            item.setQuantity(qty);
            item.setLineTotal(lineTotal);
            order.addItem(item);
            subtotal = subtotal.add(lineTotal);
        }

        if (subtotal.compareTo(shop.getMinOrderAmount()) < 0) {
            throw new BadRequestException("Minimum order value for this shop is Rs. " + shop.getMinOrderAmount());
        }

        order.setOrderNumber(generateOrderNumber());
        order.setCustomer(customer);
        order.setShop(shop);
        order.setDeliveryName(customer.getFullName());
        order.setDeliveryPhone(phone);
        order.setDeliveryAddress(address.fullText());
        order.setDeliveryPincode(address.getPincode());
        order.setSubtotal(subtotal);
        order.setDeliveryFee(shop.getDeliveryFee());
        order.setTotalAmount(subtotal.add(shop.getDeliveryFee()));
        order.setPaymentMethod(request.paymentMethod());
        order.setPaymentStatus(PaymentStatus.PENDING);
        order.setNotes(StringUtils.hasText(request.notes()) ? request.notes().trim() : null);

        // Online (UPI/CARD) orders reserve stock but stay hidden from the shop until the gateway confirms
        // payment (PaymentServiceImpl). COD orders go straight to the shop.
        boolean online = request.paymentMethod().isOnline();
        if (online) {
            order.recordStatus(OrderStatus.AWAITING_PAYMENT, customer, DEFAULT_NOTES.get(OrderStatus.AWAITING_PAYMENT));
        } else {
            order.recordStatus(OrderStatus.PLACED, customer, DEFAULT_NOTES.get(OrderStatus.PLACED));
        }

        Order saved = orderRepository.save(order);
        if (!online) {
            events.publishEvent(OrderEvent.confirmed(saved.getId()));
        }
        return DtoMapper.toOrder(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> customerOrders(Long customerId, Pageable pageable) {
        return PageResponse.of(orderRepository.findByCustomerId(customerId, pageable), DtoMapper::toOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse customerOrder(Long customerId, Long orderId) {
        return DtoMapper.toOrder(customerOwnedOrder(customerId, orderId));
    }

    @Override
    @Transactional
    public OrderResponse cancelByCustomer(Long customerId, Long orderId, String reason) {
        // Locked: an in-flight payment confirmation for the same order must not interleave with this.
        Order order = orderRepository.lockByIdAndCustomerId(orderId, customerId)
                .orElseThrow(() -> ResourceNotFoundException.of("Order", orderId));
        if (order.getStatus() != OrderStatus.PLACED && order.getStatus() != OrderStatus.AWAITING_PAYMENT) {
            throw new BadRequestException("This order can no longer be cancelled because the shop has already accepted it");
        }
        String note = StringUtils.hasText(reason) ? reason.trim() : "Cancelled by customer";
        cancel(order, userRepository.getReferenceById(customerId), note);
        events.publishEvent(OrderEvent.statusChanged(order.getId(), OrderStatus.CANCELLED));
        return DtoMapper.toOrder(order);
    }

    // =====================================================================
    // Shopkeeper
    // =====================================================================

    @Override
    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> shopOrders(Long ownerId, Collection<OrderStatus> statuses, Pageable pageable) {
        Shop shop = shopService.requireShopOfOwner(ownerId);
        if (statuses == null || statuses.isEmpty()) {
            return PageResponse.of(orderRepository.findByShopIdAndStatusNot(shop.getId(), OrderStatus.AWAITING_PAYMENT,
                    pageable), DtoMapper::toOrder);
        }
        EnumSet<OrderStatus> visible = EnumSet.copyOf(statuses);
        visible.remove(OrderStatus.AWAITING_PAYMENT);
        if (visible.isEmpty()) {
            return PageResponse.of(Page.<Order>empty(pageable), DtoMapper::toOrder);
        }
        return PageResponse.of(orderRepository.findByShopIdAndStatusIn(shop.getId(), visible, pageable),
                DtoMapper::toOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse shopOrder(Long ownerId, Long orderId) {
        return DtoMapper.toOrder(shopOwnedOrder(ownerId, orderId));
    }

    @Override
    @Transactional
    public OrderResponse updateStatus(Long ownerId, Long orderId, OrderStatusUpdateRequest request) {
        Order order = shopOwnedOrder(ownerId, orderId);
        OrderStatus target = request.status();
        if (!order.getStatus().canTransitionTo(target)) {
            throw new BadRequestException("Cannot move order from " + order.getStatus() + " to " + target);
        }
        String note = StringUtils.hasText(request.note()) ? request.note().trim() : null;
        User owner = userRepository.getReferenceById(ownerId);
        if (target == OrderStatus.CANCELLED) {
            if (note == null) {
                throw new BadRequestException("Please provide a reason for cancelling the order");
            }
            cancel(order, owner, note);
        } else {
            if (target == OrderStatus.DELIVERED && order.getPaymentMethod() == PaymentMethod.COD) {
                // Cash collected by the rider on delivery.
                order.setPaymentStatus(PaymentStatus.PAID);
                order.setPaidAt(Instant.now());
            }
            order.recordStatus(target, owner, note != null ? note : DEFAULT_NOTES.get(target));
        }
        events.publishEvent(OrderEvent.statusChanged(order.getId(), target));
        return DtoMapper.toOrder(order);
    }

    /**
     * Cancels an order and returns its reserved stock. An order that was already paid online is flagged
     * REFUND_PENDING - refund it from the Razorpay dashboard. Shared with PaymentServiceImpl (expiry).
     */
    static void cancel(Order order, User changedBy, String reason) {
        restoreStock(order);
        order.setCancelReason(reason);
        if (order.getPaymentStatus() == PaymentStatus.PAID && order.getPaymentMethod().isOnline()) {
            order.setPaymentStatus(PaymentStatus.REFUND_PENDING);
        }
        order.recordStatus(OrderStatus.CANCELLED, changedBy, reason);
    }

    // =====================================================================
    // Helpers
    // =====================================================================

    private Order customerOwnedOrder(Long customerId, Long orderId) {
        return orderRepository.findByIdAndCustomerId(orderId, customerId)
                .orElseThrow(() -> ResourceNotFoundException.of("Order", orderId));
    }

    private Order shopOwnedOrder(Long ownerId, Long orderId) {
        Shop shop = shopService.requireShopOfOwner(ownerId);
        return orderRepository.findByIdAndShopIdAndStatusNot(orderId, shop.getId(), OrderStatus.AWAITING_PAYMENT)
                .orElseThrow(() -> ResourceNotFoundException.of("Order", orderId));
    }

    /** Combines duplicate product lines and enforces the per-item unit cap. Preserves request order. */
    private static Map<Long, Integer> mergeQuantities(List<CartItemRequest> items) {
        Map<Long, Integer> merged = new LinkedHashMap<>();
        for (CartItemRequest item : items) {
            merged.merge(item.productId(), item.quantity(), Integer::sum);
        }
        merged.forEach((productId, qty) -> {
            if (qty > MAX_UNITS_PER_ITEM) {
                throw new BadRequestException("Maximum " + MAX_UNITS_PER_ITEM + " units allowed per item");
            }
        });
        return merged;
    }

    private static String stockProblem(Product product, int requested) {
        if (!product.isAvailable() || product.getStockQuantity() <= 0) {
            return "Out of stock";
        }
        if (product.getStockQuantity() < requested) {
            return "Only " + product.getStockQuantity() + " left in stock";
        }
        return null;
    }

    static void restoreStock(Order order) {
        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            if (product != null) {
                product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
            }
        }
    }

    private String generateOrderNumber() {
        String datePart = LocalDate.now(clock.zone()).format(DateTimeFormatter.BASIC_ISO_DATE);
        for (int attempt = 0; attempt < 10; attempt++) {
            StringBuilder code = new StringBuilder("QR-").append(datePart).append('-');
            for (int i = 0; i < 6; i++) {
                code.append(ORDER_CODE_ALPHABET.charAt(RANDOM.nextInt(ORDER_CODE_ALPHABET.length())));
            }
            String candidate = code.toString();
            if (!orderRepository.existsByOrderNumber(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException("Could not generate a unique order number");
    }
}
