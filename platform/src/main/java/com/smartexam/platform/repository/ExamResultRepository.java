package com.smartexam.platform.repository;

import com.smartexam.platform.entity.ExamResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamResultRepository extends JpaRepository<ExamResult, Long> {
    List<ExamResult> findByUserId(Long userId);
    List<ExamResult> findByUserIdAndSubject(Long userId, String subject);
    List<ExamResult> findTop5ByUserIdOrderByExamDateDesc(Long userId);

    // Belirli bir konuda belirli zorlukta geçme notu aldı mı?
    @Query("SELECT COUNT(e) > 0 FROM ExamResult e WHERE e.user.id = :userId AND e.topicId = :topicId AND e.difficultyLevel = :diff AND e.scorePercentage >= :minScore")
    boolean hasPassed(Long userId, Long topicId, int diff, double minScore);
}