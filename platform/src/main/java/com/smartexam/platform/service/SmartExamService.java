package com.smartexam.platform.service;

import com.smartexam.platform.dto.QuestionAttemptDto;
import com.smartexam.platform.dto.SmartExamResultDto;
import com.smartexam.platform.dto.SmartExamSubmitRequest;
import com.smartexam.platform.entity.*;
import com.smartexam.platform.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SmartExamService {

    private final UserRepository userRepository;
    private final QuestionRepository questionRepository;
    private final ExamResultRepository examResultRepository;
    private final QuestionAttemptRepository questionAttemptRepository;
    private final LessonContentRepository lessonContentRepository;
    private final BadgeService badgeService;
    private final SpacedRepetitionService spacedRepetitionService;
    private final FlaskAiService flaskAiService;
    private final TopicMasteryService topicMasteryService;

    private static final int ATTENTION_FAST_THRESHOLD_SEC = 15;
    private static final int KNOWLEDGE_GAP_SLOW_THRESHOLD_SEC = 90;

    @Transactional
    public SmartExamResultDto submitSmartExam(SmartExamSubmitRequest req) {
        if (req.getUserId() == null) throw new IllegalArgumentException("userId boş olamaz");

        User user = userRepository.findById(req.getUserId())
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        List<QuestionAttemptDto> attempts = req.getAttempts();
        List<Long> questionIds = attempts.stream()
                .map(QuestionAttemptDto::getQuestionId)
                .filter(id -> id != null)
                .toList();
        List<Question> questions = questionRepository.findAllById(questionIds);

        double weightedCorrect = 0, weightedTotal = 0;
        int correctCount = 0, wrongCount = 0, blankCount = 0;
        int attentionErrors = 0, knowledgeGaps = 0;

        List<QuestionAttempt> pendingAttempts = new ArrayList<>();

        for (QuestionAttemptDto attempt : attempts) {
            Question q = questions.stream()
                    .filter(qu -> qu.getId().equals(attempt.getQuestionId()))
                    .findFirst().orElse(null);
            if (q == null) continue;

            double weight = q.getWeightCoefficient() != null ? q.getWeightCoefficient() : 1.0;
            weightedTotal += weight;

            boolean isBlank = attempt.getUserAnswer() == null || attempt.getUserAnswer().isBlank();
            boolean isCorrect;
            if ("FILL_BLANK".equals(q.getQuestionType()) && q.getBlankAnswer() != null) {
                isCorrect = !isBlank && attempt.getUserAnswer().trim()
                        .equalsIgnoreCase(q.getBlankAnswer().trim());
            } else {
                isCorrect = !isBlank && attempt.getUserAnswer().equals(q.getCorrectAnswer());
            }
            int timeSec = attempt.getSolveTimeSec() != null ? attempt.getSolveTimeSec() : 0;

            String errorType;
            if (isBlank) {
                blankCount++;
                errorType = "BLANK";
            } else if (isCorrect) {
                correctCount++;
                weightedCorrect += weight;
                errorType = "CORRECT";
            } else {
                wrongCount++;
                if (timeSec < ATTENTION_FAST_THRESHOLD_SEC && q.getDifficultyLevel() >= 2) {
                    attentionErrors++;
                    errorType = "ATTENTION";
                } else {
                    knowledgeGaps++;
                    errorType = "KNOWLEDGE_GAP";
                }
            }

            QuestionAttempt qa = new QuestionAttempt();
            qa.setQuestion(q);
            qa.setUserAnswer(attempt.getUserAnswer());
            qa.setIsCorrect(isCorrect);
            qa.setSolveTimeSec(timeSec);
            qa.setErrorType(errorType);
            pendingAttempts.add(qa);
        }

        double weightedScore = weightedTotal > 0 ? (weightedCorrect / weightedTotal) * 100 : 0;

        // ExamResult kaydet
        ExamResult examResult = new ExamResult();
        examResult.setUser(user);
        examResult.setSubject(req.getSubject() != null ? req.getSubject() : "Karışık");
        examResult.setTopicId(req.getTopicId());
        examResult.setPackageType(req.getPackageType() != null ? req.getPackageType() : "YKS");
        examResult.setTotalQuestions(attempts.size());
        examResult.setCorrectAnswers(correctCount);
        examResult.setWrongAnswers(wrongCount);
        examResult.setScorePercentage(Math.round(weightedScore * 10.0) / 10.0);
        examResult.setDifficultyLevel(req.getDifficultyLevel() != null ? req.getDifficultyLevel() : 1);
        examResult.setDurationSeconds(req.getTotalDurationSec() != null ? req.getTotalDurationSec() : 0L);
        ExamResult saved = examResultRepository.save(examResult);

        // QuestionAttempt'leri examResult ile kaydet
        pendingAttempts.forEach(qa -> {
            qa.setExamResult(saved);
            questionAttemptRepository.save(qa);
        });

        // Konu bazlı zayıflık analizi (karma sınav)
        List<java.util.Map<String, Object>> weakTopics = topicMasteryService.updateFromMixedExam(req.getUserId(), pendingAttempts);

        String errorProfile = determineErrorProfile(attentionErrors, knowledgeGaps, correctCount);
        String recommendationType = determineRecommendation(weightedScore, knowledgeGaps);

        String contentUrl = null, contentTitle = null;
        if ("STUDY_LESSON".equals(recommendationType) && req.getTopicId() != null) {
            List<LessonContent> contents = lessonContentRepository.findByTopicId(req.getTopicId());
            if (!contents.isEmpty()) {
                contentUrl = contents.get(0).getUrl();
                contentTitle = contents.get(0).getTitle();
            }
        }

        // Rozet kontrolü
        List<Badge> earnedBadges = badgeService.checkAndAwardBadges(
                req.getUserId(), weightedScore,
                req.getDifficultyLevel() != null ? req.getDifficultyLevel() : 1,
                req.getTotalDurationSec() != null ? req.getTotalDurationSec() : 0L
        );
        Object badgeResult = earnedBadges.isEmpty() ? null :
                earnedBadges.stream()
                        .map(b -> java.util.Map.of("name", b.getName(), "icon", b.getIcon(), "description", b.getDescription()))
                        .collect(Collectors.toList());

        // Aralıklı tekrar güncelle
        if (req.getTopicId() != null) {
            spacedRepetitionService.updateAfterExam(req.getUserId(), req.getTopicId(), weightedScore);
        }

        // Flask ML — akıllı tahmin
        int totalQ = attempts.size() > 0 ? attempts.size() : 1;
        long totalSec = req.getTotalDurationSec() != null ? req.getTotalDurationSec() : 0L;
        double avgSolveTime = (double) totalSec / totalQ;
        int diffLevel = req.getDifficultyLevel() != null ? req.getDifficultyLevel() : 1;

        var flaskResult = flaskAiService.predictSmart(
                Math.round(weightedScore * 10.0) / 10.0,
                Math.round(avgSolveTime * 10.0) / 10.0,
                attentionErrors, knowledgeGaps, diffLevel
        );

        // Flask sonucuna göre öneriyi güncelle (Flask daha doğruysa override et)
        if (flaskResult != null && flaskResult.getLevel() == 2 && !"STUDY_LESSON".equals(recommendationType)) {
            recommendationType = "STUDY_LESSON";
        }

        return new SmartExamResultDto(
                saved.getId(),
                Math.round(weightedScore * 10.0) / 10.0,
                correctCount, wrongCount, blankCount,
                attentionErrors, knowledgeGaps,
                errorProfile, recommendationType,
                contentUrl, contentTitle, badgeResult,
                flaskResult != null ? flaskResult.getLevel() : null,
                flaskResult != null ? flaskResult.getMessage() : null,
                flaskResult != null ? flaskResult.getConfidence() : null,
                flaskResult != null ? flaskResult.getTrainingSamples() : null,
                weakTopics
        );
    }

    private String determineErrorProfile(int attention, int gap, int correct) {
        if (attention == 0 && gap == 0) return "GOOD";
        if (attention > gap) return "ATTENTION";
        if (gap > attention) return "KNOWLEDGE_GAP";
        return "MIXED";
    }

    private String determineRecommendation(double score, int gaps) {
        if (score >= 80) return "ADVANCE";
        if (gaps >= 2) return "STUDY_LESSON";
        return "RETRY_TEST";
    }
}
