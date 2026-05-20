package com.smartexam.platform.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class QuestionAttemptDto {
    private Long questionId;
    private String userAnswer;
    private Integer solveTimeSec;
}
