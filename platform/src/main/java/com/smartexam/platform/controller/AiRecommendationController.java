package com.smartexam.platform.controller;

import com.smartexam.platform.dto.AnalyzeRequest;
import com.smartexam.platform.dto.AiPredictResponse;
import com.smartexam.platform.entity.AiRecommendation;
import com.smartexam.platform.entity.ExamResult;
import com.smartexam.platform.entity.QuestionAttempt;
import com.smartexam.platform.repository.QuestionAttemptRepository;
import com.smartexam.platform.service.AiRecommendationService;
import com.smartexam.platform.service.ExamResultService;
import com.smartexam.platform.service.FlaskAiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class AiRecommendationController {

    private final AiRecommendationService aiRecommendationService;
    private final ExamResultService examResultService;
    private final FlaskAiService flaskAiService;
    private final QuestionAttemptRepository questionAttemptRepository;

    @PostMapping("/analyze")
    public ResponseEntity<?> analyze(@RequestBody AnalyzeRequest req) {
        AiPredictResponse prediction = flaskAiService.predict(
                req.getDogru(), req.getYanlis(), req.getSure(), req.getKonuId()
        );
        AiRecommendation saved = aiRecommendationService.saveFromPrediction(
                req.getUserId(), req.getSubject(), prediction
        );
        return ResponseEntity.ok(Map.of(
                "recommendation", saved,
                "aiDetail", prediction
        ));
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Boolean>> aiHealth() {
        return ResponseEntity.ok(Map.of("flaskUp", flaskAiService.isHealthy()));
    }

    @PostMapping("/retrain")
    public ResponseEntity<?> retrain() {
        List<ExamResult> allResults = examResultService.getAllResults();

        // Her sınav için question_attempts'tan gerçek hata verilerini topla
        var enriched = allResults.stream().map(er -> {
            List<QuestionAttempt> attempts = questionAttemptRepository.findByExamResultId(er.getId());
            long attention  = attempts.stream().filter(a -> "ATTENTION".equals(a.getErrorType())).count();
            long gap        = attempts.stream().filter(a -> "KNOWLEDGE_GAP".equals(a.getErrorType())).count();
            double avgTime  = attempts.isEmpty() ? 30.0
                    : attempts.stream().mapToInt(QuestionAttempt::getSolveTimeSec).average().orElse(30.0);

            return Map.of(
                "scorePercentage",  er.getScorePercentage(),
                "correctAnswers",   er.getCorrectAnswers(),
                "wrongAnswers",     er.getWrongAnswers(),
                "totalQuestions",   er.getTotalQuestions(),
                "durationSeconds",  er.getDurationSeconds(),
                "difficultyLevel",  er.getDifficultyLevel(),
                "attentionErrors",  attention,
                "knowledgeGaps",    gap,
                "avgSolveTime",     Math.round(avgTime * 10.0) / 10.0
            );
        }).toList();

        var result = flaskAiService.retrainModel(Map.of("results", enriched));
        return ResponseEntity.ok(result);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<AiRecommendation>> getRecommendationsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(aiRecommendationService.getRecommendationsByUser(userId));
    }

    @GetMapping("/user/{userId}/subject/{subject}/latest")
    public ResponseEntity<AiRecommendation> getLatestRecommendation(
            @PathVariable Long userId,
            @PathVariable String subject) {
        return ResponseEntity.ok(aiRecommendationService.getLatestRecommendation(userId, subject));
    }
}