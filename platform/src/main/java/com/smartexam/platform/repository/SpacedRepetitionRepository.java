package com.smartexam.platform.repository;

import com.smartexam.platform.entity.SpacedRepetition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SpacedRepetitionRepository extends JpaRepository<SpacedRepetition, Long> {
    List<SpacedRepetition> findByUserIdAndNextReviewDateLessThanEqual(Long userId, LocalDate date);
    Optional<SpacedRepetition> findByUserIdAndTopicId(Long userId, Long topicId);
    List<SpacedRepetition> findByUserId(Long userId);
}
