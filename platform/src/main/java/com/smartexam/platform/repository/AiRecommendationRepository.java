package com.smartexam.platform.repository;

import com.smartexam.platform.entity.AiRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiRecommendationRepository extends JpaRepository<AiRecommendation, Long> {
    List<AiRecommendation> findByUserId(Long userId);
    List<AiRecommendation> findTop1ByUserIdAndSubjectOrderByRecommendedAtDesc(Long userId, String subject);
}