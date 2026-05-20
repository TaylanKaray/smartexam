package com.smartexam.platform.controller;

import com.smartexam.platform.dto.SmartExamResultDto;
import com.smartexam.platform.dto.SmartExamSubmitRequest;
import com.smartexam.platform.entity.Question;
import com.smartexam.platform.entity.UserSeenQuestion;
import com.smartexam.platform.repository.ExamResultRepository;
import com.smartexam.platform.repository.QuestionRepository;
import com.smartexam.platform.repository.TopicRepository;
import com.smartexam.platform.repository.UserSeenQuestionRepository;
import com.smartexam.platform.service.SmartExamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/smart-exam")
@RequiredArgsConstructor
public class SmartExamController {

    private final SmartExamService smartExamService;
    private final QuestionRepository questionRepository;
    private final TopicRepository topicRepository;
    private final ExamResultRepository examResultRepository;
    private final UserSeenQuestionRepository userSeenQuestionRepository;

    private static final double KOLAY_PASS_SCORE = 90.0;
    private static final double ORTA_PASS_SCORE  = 85.0;

    // Konu bazlı sınav — görülmemiş soruları önce göster; havuz bitince sıfırla
    @GetMapping("/topic/{topicId}/questions")
    @Transactional
    public ResponseEntity<List<Question>> getTopicQuestions(
            @PathVariable Long topicId,
            @RequestParam(defaultValue = "15") int limit,
            @RequestParam(required = false) Integer difficulty,
            @RequestParam(required = false) Long userId) {

        List<Question> questions;

        if (userId != null && difficulty != null) {
            long poolSize = questionRepository.countByTopicIdAndDiff(topicId, difficulty);
            long seenCount = userSeenQuestionRepository.countByUserIdAndTopicIdAndDifficultyLevel(userId, topicId, difficulty);

            // Havuz bittiyse sıfırla
            if (seenCount >= poolSize && poolSize > 0) {
                userSeenQuestionRepository.deleteByUserIdAndTopicIdAndDifficultyLevel(userId, topicId, difficulty);
                seenCount = 0;
            }

            List<Long> seenIds = seenCount > 0
                    ? userSeenQuestionRepository.findSeenIds(userId, topicId, difficulty)
                    : List.of(-1L); // boş liste için dummy

            questions = questionRepository.findRandomByTopicIdAndDifficultyExcluding(topicId, difficulty, seenIds, limit);

            // Gösterilen soruları kaydet
            final int diff = difficulty;
            questions.forEach(q -> {
                try {
                    userSeenQuestionRepository.save(new UserSeenQuestion(userId, q.getId(), topicId, diff));
                } catch (Exception ignored) {} // zaten kayıtlıysa atla
            });

        } else if (difficulty != null) {
            questions = questionRepository.findRandomByTopicIdAndDifficulty(topicId, difficulty, limit);
        } else {
            questions = questionRepository.findRandomByTopicId(topicId, limit);
        }

        return ResponseEntity.ok(questions);
    }

    // Karışık sınav — pakete göre topic'lerden rastgele havuz
    @GetMapping("/mixed/questions")
    public ResponseEntity<List<Question>> getMixedQuestions(
            @RequestParam(defaultValue = "15") int limit,
            @RequestParam(required = false) String pkg) {

        // KPSS course ID'leri: Matematik(1), Tarih(5), Coğrafya(6), Türkçe(9), Vatandaşlık(10)
        // YKS  course ID'leri: Matematik(1), Fizik(2), Kimya(3), Biyoloji(4), Tarih(5), Coğrafya(6)
        List<Long> courseIds = "KPSS".equals(pkg)
                ? List.of(1L, 5L, 6L, 9L, 10L)
                : List.of(1L, 2L, 3L, 4L, 5L, 6L, 11L, 12L, 13L, 14L);

        List<Long> topicIds = topicRepository.findAll().stream()
                .filter(t -> t.getCourse() != null && courseIds.contains(t.getCourse().getId()))
                .map(t -> t.getId())
                .toList();

        if (topicIds.isEmpty()) return ResponseEntity.ok(List.of());

        List<Question> questions = questionRepository.findRandomByTopicIds(topicIds, limit);
        return ResponseEntity.ok(questions);
    }

    // Akıllı sınav gönder (ağırlıklı skor + hata analizi)
    @PostMapping("/submit")
    public ResponseEntity<SmartExamResultDto> submit(@RequestBody SmartExamSubmitRequest req) {
        return ResponseEntity.ok(smartExamService.submitSmartExam(req));
    }

    /**
     * Öğrencinin bu konudaki zorluk seviyesi kilidi:
     * kolay → her zaman açık
     * orta  → kolay'dan geçtiyse açık
     * zor   → orta'dan geçtiyse açık
     */
    @GetMapping("/topic/{topicId}/unlock/{userId}")
    public ResponseEntity<Map<String, Object>> getUnlockStatus(
            @PathVariable Long topicId,
            @PathVariable Long userId) {

        boolean kolayPassed = examResultRepository.hasPassed(userId, topicId, 1, KOLAY_PASS_SCORE);
        boolean ortaPassed  = examResultRepository.hasPassed(userId, topicId, 2, ORTA_PASS_SCORE);

        return ResponseEntity.ok(Map.of(
                "kolay", true,
                "orta",  kolayPassed,
                "zor",   ortaPassed,
                "kolayPassed", kolayPassed,
                "ortaPassed",  ortaPassed
        ));
    }
}
