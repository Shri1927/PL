package com.fintech.los.domain.underwriter.repository;

import com.fintech.los.domain.underwriter.UnderwriterReview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UnderwriterReviewRepository extends JpaRepository<UnderwriterReview, Long> {
    List<UnderwriterReview> findByApplicationId(Long applicationId);
}
