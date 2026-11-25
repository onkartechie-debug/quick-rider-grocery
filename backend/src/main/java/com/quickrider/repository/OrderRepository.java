package com.quickrider.repository;

import com.quickrider.entity.Order;
import com.quickrider.entity.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
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

    long countByCreatedAtGreaterThanEqual(Instant from);

    long countByShopIdAndCreatedAtGreaterThanEqual(Long shopId, Instant from);

    long countByShopIdAndStatusIn(Long shopId, Collection<OrderStatus> statuses);

    @Query("select coalesce(sum(o.totalAmount), cast(0 as BigDecimal)) from CustomerOrder o where o.status = :status")
    BigDecimal sumTotalByStatus(@Param("status") OrderStatus status);

    @Query("""
            select coalesce(sum(o.totalAmount), cast(0 as BigDecimal)) from CustomerOrder o
            where o.shop.id = :shopId and o.status <> com.quickrider.entity.enums.OrderStatus.CANCELLED
              and o.createdAt >= :from
            """)
    BigDecimal sumShopRevenueSince(@Param("shopId") Long shopId, @Param("from") Instant from);

    @Query("select o.status, count(o) from CustomerOrder o group by o.status")
    List<Object[]> countGroupedByStatus();

    @Query("select o.status, count(o) from CustomerOrder o where o.shop.id = :shopId group by o.status")
    List<Object[]> countGroupedByStatusForShop(@Param("shopId") Long shopId);
}
