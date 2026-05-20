package com.smartexam.platform.repository;

import com.smartexam.platform.entity.UserSeenQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface UserSeenQuestionRepository extends JpaRepository<UserSeenQuestion, Long> {

    @Query("SELECT u.questionId FROM UserSeenQuestion u WHERE u.userId = :userId AND u.topicId = :topicId AND u.difficultyLevel = :diff")
    List<Long> findSeenIds(Long userId, Long topicId, Integer diff);

    long countByUserIdAndTopicIdAndDifficultyLevel(Long userId, Long topicId, Integer diff);

    @Modifying
    @Transactional
    void deleteByUserIdAndTopicIdAndDifficultyLevel(Long userId, Long topicId, Integer diff);
}
