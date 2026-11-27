package com.quickrider.repository;

import com.quickrider.entity.User;
import com.quickrider.entity.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailIgnoreCase(String email);

    /** Phone is not unique in the schema; OTP login only proceeds when exactly one account matches. */
    List<User> findByPhone(String phone);

    boolean existsByEmailIgnoreCase(String email);

    long countByRole(Role role);

    long countByRoleAndEnabledTrue(Role role);

    long countByEnabledTrue();

    /** Enabled shopkeepers that do not yet own a shop (candidates when onboarding a shop). */
    @Query("""
            select u from User u
            where u.role = com.quickrider.entity.enums.Role.SHOPKEEPER
              and u.enabled = true
              and not exists (select s.id from Shop s where s.owner = u)
            order by u.fullName
            """)
    List<User> findUnassignedShopkeepers();
}
