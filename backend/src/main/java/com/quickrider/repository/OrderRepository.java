package com.quickrider.repository;

import com.quickrider.entity.Order;
import com.quickrider.entity.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    boolean existsByOrderNumber(String orderNumber);

    @EntityGraph(attributePaths = "shop")
    Page<Order> findByCustomerId(Long customerId, Pageable pageable);

    @EntityGraph(attributePaths = "shop")
    Optional<Order> findByIdAndCustomerId(Long id, Long customerId);

    @EntityGraph(attributePaths = "shop")
    Page<Order> findByShopId(Long shopId, Pageable pageable);

    @EntityGraph(attributePaths = "shop")
    Page<Order> findByShopIdAndStatusIn(Long shopId, Collection<OrderStatus> statuses, Pageable pageable);

    @EntityGraph(attributePaths = "shop")
    Optional<Order> findByIdAndShopId(Long id, Long shopId);

    /** Shop-facing lists exclude AWAITING_PAYMENT: an unpaid online order must not be packed. */
    @EntityGraph(attributePaths = "shop")
    Page<Order> findByShopIdAndStatusNot(Long shopId, OrderStatus status, Pageable pageable);

    @EntityGraph(attributePaths = "shop")
    Optional<Order> findByIdAndShopIdAndStatusNot(Long id, Long shopId, OrderStatus status);

    // ----- Payments: row-locked so client verify, webhook and expiry job can't race each other -----

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from CustomerOrder o where o.id = :id and o.customer.id = :customerId")
    Optional<Order> lockByIdAndCustomerId(@Param("id") Long id, @Param("customerId") Long customerId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from CustomerOrder o where o.razorpayOrderId = :razorpayOrderId")
    Optional<Order> lockByRazorpayOrderId(@Param("razorpayOrderId") String razorpayOrderId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from CustomerOrder o where o.id = :id")
    Optional<Order> lockById(@Param("id") Long id);

    @Query("select o.id from CustomerOrder o where o.status = :status and o.createdAt < :before order by o.createdAt")
    List<Long> findIdsByStatusCreatedBefore(@Param("status") OrderStatus status, @Param("before") Instant before,
                                            Pageable pageable);

    long countByCreatedAtGreaterThanEqual(Instant from);

    long countByShopIdAndCreatedAtGreaterThanEqual(Long shopId, Instant from);

    long countByShopIdAndStatusIn(Long shopId, Collection<OrderStatus> statuses);

    @Query("select coalesce(sum(o.totalAmount), cast(0 as BigDecimal)) from CustomerOrder o where o.status = :status")
    BigDecimal sumTotalByStatus(@Param("status") OrderStatus status);

    @Query("""
            select coalesce(sum(o.totalAmount), cast(0 as BigDecimal)) from CustomerOrder o
            where o.shop.id = :shopId
              and o.status not in (com.quickrider.entity.enums.OrderStatus.CANCELLED,
                                   com.quickrider.entity.enums.OrderStatus.AWAITING_PAYMENT)
              and o.createdAt >= :from
            """)
    BigDecimal sumShopRevenueSince(@Param("shopId") Long shopId, @Param("from") Instant from);

    @Query("select o.status, count(o) from CustomerOrder o group by o.status")
    List<Object[]> countGroupedByStatus();

    @Query("""
            select o.status, count(o) from CustomerOrder o
            where o.shop.id = :shopId and o.status <> com.quickrider.entity.enums.OrderStatus.AWAITING_PAYMENT
            group by o.status
            """)
    List<Object[]> countGroupedByStatusForShop(@Param("shopId") Long shopId);
}
