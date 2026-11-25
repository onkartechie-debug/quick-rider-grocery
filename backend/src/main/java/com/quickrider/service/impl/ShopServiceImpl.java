package com.quickrider.service.impl;

import com.quickrider.dto.request.CreateShopRequest;
import com.quickrider.dto.request.NewShopkeeperRequest;
import com.quickrider.dto.request.ShopRequest;
import com.quickrider.dto.response.OwnerSummary;
import com.quickrider.dto.response.PageResponse;
import com.quickrider.dto.response.ShopResponse;
import com.quickrider.entity.Shop;
import com.quickrider.entity.User;
import com.quickrider.entity.enums.Role;
import com.quickrider.exception.BadRequestException;
import com.quickrider.exception.ConflictException;
import com.quickrider.exception.ResourceNotFoundException;
import com.quickrider.mapper.DtoMapper;
import com.quickrider.repository.ShopRepository;
import com.quickrider.repository.UserRepository;
import com.quickrider.repository.spec.ShopSpecifications;
import com.quickrider.service.ShopService;
import com.quickrider.util.BusinessClock;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ShopServiceImpl implements ShopService {

    private final ShopRepository shopRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final BusinessClock clock;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ShopResponse> adminList(String q, Boolean active, Pageable pageable) {
        return PageResponse.of(
                shopRepository.findAll(ShopSpecifications.filter(q, null, active), pageable),
                shop -> DtoMapper.toShop(shop, clock.isOpenNow(shop), true));
    }

    @Override
    @Transactional(readOnly = true)
    public ShopResponse adminGet(Long shopId) {
        Shop shop = findWithOwner(shopId);
        return DtoMapper.toShop(shop, clock.isOpenNow(shop), true);
    }

    @Override
    @Transactional
    public ShopResponse create(CreateShopRequest request) {
        User owner = request.existingShopkeeperId() != null
                ? resolveExistingShopkeeper(request.existingShopkeeperId())
                : createShopkeeper(request.newShopkeeper());

        Shop shop = new Shop();
        apply(shop, request.shop());
        shop.setOwner(owner);
        shop.setActive(true);
        Shop saved = shopRepository.save(shop);
        return DtoMapper.toShop(saved, clock.isOpenNow(saved), true);
    }

    @Override
    @Transactional
    public ShopResponse update(Long shopId, ShopRequest request) {
        Shop shop = findWithOwner(shopId);
        apply(shop, request);
        return DtoMapper.toShop(shop, clock.isOpenNow(shop), true);
    }

    @Override
    @Transactional
    public ShopResponse setActive(Long shopId, boolean active) {
        Shop shop = findWithOwner(shopId);
        shop.setActive(active);
        return DtoMapper.toShop(shop, clock.isOpenNow(shop), true);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OwnerSummary> availableShopkeepers() {
        return userRepository.findUnassignedShopkeepers().stream().map(DtoMapper::toOwner).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ShopResponse> discover(String pincode, String q, Pageable pageable) {
        return PageResponse.of(
                shopRepository.findAll(ShopSpecifications.filter(q, pincode, true), pageable),
                shop -> DtoMapper.toShop(shop, clock.isOpenNow(shop), false));
    }

    @Override
    @Transactional(readOnly = true)
    public ShopResponse publicGet(Long shopId) {
        Shop shop = shopRepository.findByIdAndActiveTrue(shopId)
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found or currently unavailable"));
        return DtoMapper.toShop(shop, clock.isOpenNow(shop), false);
    }

    @Override
    @Transactional(readOnly = true)
    public ShopResponse myShop(Long ownerId) {
        Shop shop = requireShopOfOwner(ownerId);
        return DtoMapper.toShop(shop, clock.isOpenNow(shop), true);
    }

    @Override
    @Transactional(readOnly = true)
    public Shop requireShopOfOwner(Long ownerId) {
        return shopRepository.findByOwnerId(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No shop is assigned to your account yet. Please contact the QuickRider admin."));
    }

    private Shop findWithOwner(Long shopId) {
        return shopRepository.findWithOwnerById(shopId)
                .orElseThrow(() -> ResourceNotFoundException.of("Shop", shopId));
    }

    private User resolveExistingShopkeeper(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.of("User", userId));
        if (user.getRole() != Role.SHOPKEEPER) {
            throw new BadRequestException("Selected user is not a shopkeeper");
        }
        if (!user.isEnabled()) {
            throw new BadRequestException("Selected shopkeeper account is disabled");
        }
        if (shopRepository.findByOwnerId(userId).isPresent()) {
            throw new ConflictException("This shopkeeper already manages a shop");
        }
        return user;
    }

    private User createShopkeeper(NewShopkeeperRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("An account with email " + email + " already exists");
        }
        User user = new User();
        user.setFullName(request.fullName().trim());
        user.setEmail(email);
        user.setPhone(blankToNull(request.phone()));
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(Role.SHOPKEEPER);
        user.setEnabled(true);
        return userRepository.save(user);
    }

    private void apply(Shop shop, ShopRequest r) {
        shop.setName(r.name().trim());
        shop.setDescription(blankToNull(r.description()));
        shop.setAddress(r.address().trim());
        shop.setCity(r.city().trim());
        shop.setPincode(r.pincode().trim());
        shop.setPhone(blankToNull(r.phone()));
        shop.setDeliveryRadiusKm(r.deliveryRadiusKm());
        shop.setOpeningTime(r.openingTime());
        shop.setClosingTime(r.closingTime());
        shop.setImageUrl(blankToNull(r.imageUrl()));
        shop.setMinOrderAmount(r.minOrderAmount() != null ? r.minOrderAmount() : BigDecimal.ZERO);
        shop.setDeliveryFee(r.deliveryFee() != null ? r.deliveryFee() : BigDecimal.ZERO);
    }

    private static String blankToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
