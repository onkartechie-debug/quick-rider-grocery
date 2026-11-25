package com.quickrider.repository.spec;

import com.quickrider.entity.Shop;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public final class ShopSpecifications {

    private ShopSpecifications() {
    }

    /**
     * @param q       matches shop name, city or pincode (case-insensitive)
     * @param pincode exact pincode match
     * @param active  null for all shops
     */
    public static Specification<Shop> filter(String q, String pincode, Boolean active) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (active != null) {
                predicates.add(cb.equal(root.get("active"), active));
            }
            if (StringUtils.hasText(pincode)) {
                predicates.add(cb.equal(root.get("pincode"), pincode.trim()));
            }
            if (StringUtils.hasText(q)) {
                String like = "%" + escape(q.trim().toLowerCase(Locale.ROOT)) + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), like, '\\'),
                        cb.like(cb.lower(root.get("city")), like, '\\'),
                        cb.like(root.get("pincode"), like, '\\')));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    static String escape(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
