package com.smartexam.platform.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_recommendations")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class AiRecommendation {

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
    private Integer recommendedDifficulty;

    private Double confidenceScore;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime recommendedAt;
}