package com.smartexam.platform.repository;

import com.smartexam.platform.entity.QuestionAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionAttemptRepository extends JpaRepository<QuestionAttempt, Long> {
    List<QuestionAttempt> findByExamResultId(Long examResultId);
    List<QuestionAttempt> findByExamResultUserIdAndErrorType(Long userId, String errorType);

    // Konu bazlı ilerleme: kullanıcının bir konuda kaç soru çözüp kaçını doğru yaptığı
    @Query("""
        SELECT qa.question.topic.id AS topicId,
               qa.question.topic.course.id AS courseId,
               COUNT(qa) AS total,
               SUM(CASE WHEN qa.isCorrect = true THEN 1 ELSE 0 END) AS correct
        FROM QuestionAttempt qa
        WHERE qa.examResult.user.id = :userId
          AND qa.question.topic IS NOT NULL
        GROUP BY qa.question.topic.id, qa.question.topic.course.id
    """)
    List<Object[]> findTopicProgressByUser(Long userId);
}
