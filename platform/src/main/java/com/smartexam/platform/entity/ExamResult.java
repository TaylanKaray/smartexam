package com.smartexam.platform.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "exam_results")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class ExamResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password", "roles", "enabled", "createdAt"})
    private User user;

    @Column(nullable = false)
    private String subject;

    @Column(nullable = false)
    private Integer totalQuestions;

    @Column(nullable = false)
    private Integer correctAnswers;

    @Column(nullable = false)
    private Integer wrongAnswers;

    @Column(nullable = false)
    private Double scorePercentage;

    @Column(nullable = false)
    private Integer difficultyLevel;

    @Column(nullable = false)
    private Long durationSeconds;

    @Column(name = "topic_id")
    private Long topicId;

    @Column(name = "package_type")
    private String packageType = "YKS";

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime examDate;
}