package com.smartexam.platform.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_seen_questions")
@Getter @Setter @NoArgsConstructor
public class UserSeenQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "question_id", nullable = false)
    private Long questionId;

    @Column(name = "topic_id", nullable = false)
    private Long topicId;

    @Column(name = "difficulty_level", nullable = false)
    private Integer difficultyLevel;

    @Column(name = "seen_at")
    private LocalDateTime seenAt = LocalDateTime.now();

    public UserSeenQuestion(Long userId, Long questionId, Long topicId, Integer difficultyLevel) {
        this.userId = userId;
        this.questionId = questionId;
        this.topicId = topicId;
        this.difficultyLevel = difficultyLevel;
    }
}
