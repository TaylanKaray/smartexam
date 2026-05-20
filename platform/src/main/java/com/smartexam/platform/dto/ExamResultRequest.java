package com.smartexam.platform.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ExamResultRequest {
    private Long userId;
    private String subject;
    private Integer totalQuestions;
    private Integer correctAnswers;
    private Integer wrongAnswers;
    private Double scorePercentage;
    private Integer difficultyLevel;
    private Long durationSeconds;
}
