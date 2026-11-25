package com.quickrider.repository;

import com.quickrider.entity.Product;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    @Override
    @EntityGraph(attributePaths = "category")
    Page<Product> findAll(Specification<Product> spec, Pageable pageable);

    @EntityGraph(attributePaths = "category")
    Optional<Product> findByIdAndShopId(Long id, Long shopId);

    @EntityGraph(attributePaths = "category")
    List<Product> findByIdInAndShopId(Collection<Long> ids, Long shopId);

    /** Row-locks the products of an order (ordered by id to avoid deadlocks) before decrementing stock. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Product p where p.id in :ids and p.shop.id = :shopId order by p.id")
    List<Product> lockForCheckout(@Param("ids") Collection<Long> ids, @Param("shopId") Long shopId);

    boolean existsByShopIdAndNameIgnoreCaseAndUnitIgnoreCase(Long shopId, String name, String unit);

    boolean existsByShopIdAndNameIgnoreCaseAndUnitIgnoreCaseAndIdNot(Long shopId, String name, String unit, Long id);

    long countByShopId(Long shopId);

    long countByShopIdAndStockQuantityLessThan(Long shopId, int threshold);
}
