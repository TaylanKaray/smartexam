package com.smartexam.platform.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
public class SmartPredictResponse {
    private int level;
    private String message;
    private double confidence;
    private int trainingSamples;
    private Map<String, Double> probabilities;
}
