package com.smartexam.platform.repository;

import com.smartexam.platform.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findBySubject(String subject);
    List<Question> findBySubjectAndDifficultyLevel(String subject, Integer difficultyLevel);
    List<Question> findByDifficultyLevel(Integer difficultyLevel);

    // Topic bazlı sorgular
    List<Question> findByTopicId(Long topicId);
    List<Question> findByTopicIdAndDifficultyLevel(Long topicId, Integer difficultyLevel);

    // Rastgele soru çekimi (büyük havuzdan)
    @Query(value = "SELECT * FROM questions WHERE topic_id = :topicId ORDER BY RANDOM() LIMIT :limit", nativeQuery = true)
    List<Question> findRandomByTopicId(Long topicId, int limit);

    @Query(value = "SELECT * FROM questions WHERE topic_id = :topicId AND difficulty_level = :diff ORDER BY RANDOM() LIMIT :limit", nativeQuery = true)
    List<Question> findRandomByTopicIdAndDifficulty(Long topicId, int diff, int limit);

    // Karışık sınav — birden fazla topic'ten rastgele soru havuzu
    @Query(value = "SELECT * FROM questions WHERE topic_id IN :topicIds ORDER BY RANDOM() LIMIT :limit", nativeQuery = true)
    List<Question> findRandomByTopicIds(List<Long> topicIds, int limit);

    // Görülmemiş soruları önce çek (seen tracking)
    @Query(value = "SELECT * FROM questions WHERE topic_id = :topicId AND difficulty_level = :diff AND id NOT IN :excludeIds ORDER BY RANDOM() LIMIT :limit", nativeQuery = true)
    List<Question> findRandomByTopicIdAndDifficultyExcluding(Long topicId, int diff, List<Long> excludeIds, int limit);

    @Query(value = "SELECT COUNT(*) FROM questions WHERE topic_id = :topicId AND difficulty_level = :diff", nativeQuery = true)
    long countByTopicIdAndDiff(Long topicId, int diff);
}
