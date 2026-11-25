package com.quickrider.repository;

import com.quickrider.entity.Shop;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface ShopRepository extends JpaRepository<Shop, Long>, JpaSpecificationExecutor<Shop> {

    @Override
    @EntityGraph(attributePaths = "owner")
    Page<Shop> findAll(Specification<Shop> spec, Pageable pageable);

    @EntityGraph(attributePaths = "owner")
    Optional<Shop> findWithOwnerById(Long id);

    Optional<Shop> findByOwnerId(Long ownerId);

    Optional<Shop> findByIdAndActiveTrue(Long id);

    long countByActiveTrue();
}
