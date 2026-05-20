package com.smartexam.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SmartPredictRequest {
    private double weightedScore;
    private double avgSolveTime;
    private int attentionErrors;
    private int knowledgeGaps;
    private int difficulty;
}
