package com.quickrider.repository;

import com.quickrider.entity.OtpChallenge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;

public interface OtpChallengeRepository extends JpaRepository<OtpChallenge, Long> {

    Optional<OtpChallenge> findFirstByPhoneAndPurposeOrderByCreatedAtDesc(String phone, String purpose);

    long countByPhoneAndPurposeAndCreatedAtAfter(String phone, String purpose, Instant after);
}
