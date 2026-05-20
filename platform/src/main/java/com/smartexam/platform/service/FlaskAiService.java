package com.smartexam.platform.service;

import com.smartexam.platform.dto.AiPredictRequest;
import com.smartexam.platform.dto.AiPredictResponse;
import com.smartexam.platform.dto.SmartPredictRequest;
import com.smartexam.platform.dto.SmartPredictResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
public class FlaskAiService {

    private final RestTemplate restTemplate;

    @Value("${ai.service.url:http://localhost:5000}")
    private String aiServiceUrl;

    public AiPredictResponse predict(int dogru, int yanlis, int sure, int konuId) {
        AiPredictRequest request = new AiPredictRequest(dogru, yanlis, sure, konuId);
        return restTemplate.postForObject(aiServiceUrl + "/predict", request, AiPredictResponse.class);
    }

    public boolean isHealthy() {
        try {
            restTemplate.getForObject(aiServiceUrl + "/health", String.class);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public SmartPredictResponse predictSmart(double weightedScore, double avgSolveTime,
                                              int attentionErrors, int knowledgeGaps, int difficulty) {
        SmartPredictRequest req = new SmartPredictRequest(weightedScore, avgSolveTime,
                attentionErrors, knowledgeGaps, difficulty);
        try {
            return restTemplate.postForObject(aiServiceUrl + "/predict-smart", req, SmartPredictResponse.class);
        } catch (Exception e) {
            return null;
        }
    }

    public Object retrainModel(Object payload) {
        return restTemplate.postForObject(aiServiceUrl + "/retrain", payload, Object.class);
    }
}
