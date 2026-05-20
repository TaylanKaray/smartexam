package com.smartexam.platform.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
public class SmartExamSubmitRequest {
    private Long userId;
    private Long topicId;
    private String subject;
    private String packageType;   // YKS | KPSS | LGS
    private Integer difficultyLevel;
    private Long totalDurationSec;
    private List<QuestionAttemptDto> attempts;
}
