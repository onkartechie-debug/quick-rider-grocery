package com.quickrider.repository.spec;

import com.quickrider.entity.Product;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public final class ProductSpecifications {

    private ProductSpecifications() {
    }

    /**
     * @param onlyAvailable when true, hides items the shopkeeper has marked unavailable (customer storefront)
     * @param inStockOnly   when true, hides items with zero stock
     */
    public static Specification<Product> filter(Long shopId, Long categoryId, String q,
                                                boolean onlyAvailable, boolean inStockOnly) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("shop").get("id"), shopId));
            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }
            if (onlyAvailable) {
                predicates.add(cb.isTrue(root.get("available")));
            }
            if (inStockOnly) {
                predicates.add(cb.greaterThan(root.get("stockQuantity"), 0));
            }
            if (StringUtils.hasText(q)) {
                String like = "%" + ShopSpecifications.escape(q.trim().toLowerCase(Locale.ROOT)) + "%";
                predicates.add(cb.like(cb.lower(root.get("name")), like, '\\'));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
