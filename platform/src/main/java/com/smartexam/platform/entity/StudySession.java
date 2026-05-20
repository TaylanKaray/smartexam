package com.smartexam.platform.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "study_sessions")
@Getter @Setter @NoArgsConstructor
public class StudySession {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id",          nullable = false) private Long userId;
    @Column(name = "topic_id")                           private Long topicId;
    @Column(name = "duration_seconds", nullable = false) private Integer durationSeconds;
    @Column(name = "session_type")                       private String sessionType = "POMODORO";
    @Column(name = "completed")                          private Boolean completed   = true;
    @Column(name = "started_at")                         private LocalDateTime startedAt = LocalDateTime.now();
}
