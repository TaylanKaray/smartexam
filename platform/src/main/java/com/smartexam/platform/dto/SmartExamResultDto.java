package com.smartexam.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@AllArgsConstructor
public class SmartExamResultDto {
    private Long examResultId;
    private Double weightedScore;
    private Integer correctCount;
    private Integer wrongCount;
    private Integer blankCount;
    private Integer attentionErrors;
    private Integer knowledgeGaps;
    private String errorProfile;
    private String aiRecommendationType;
    private String lessonContentUrl;
    private String lessonContentTitle;
    private Object aiBadge;
    private Integer aiLevel;
    private String aiMessage;
    private Double aiConfidence;
    private Integer aiTrainingSamples;
    private List<Map<String, Object>> weakTopics;
}
