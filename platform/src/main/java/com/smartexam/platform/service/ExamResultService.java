package com.smartexam.platform.service;

import com.smartexam.platform.dto.ExamResultRequest;
import com.smartexam.platform.entity.ExamResult;
import com.smartexam.platform.entity.User;
import com.smartexam.platform.repository.ExamResultRepository;
import com.smartexam.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ExamResultService {

    private final ExamResultRepository examResultRepository;
    private final UserRepository userRepository;

    public ExamResult saveFromRequest(ExamResultRequest req) {
        if (req.getUserId() == null) throw new IllegalArgumentException("userId boş olamaz");
        User user = userRepository.findById(req.getUserId())
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı: " + req.getUserId()));
        ExamResult result = new ExamResult();
        result.setUser(user);
        result.setSubject(req.getSubject());
        result.setTotalQuestions(req.getTotalQuestions());
        result.setCorrectAnswers(req.getCorrectAnswers());
        result.setWrongAnswers(req.getWrongAnswers());
        result.setScorePercentage(req.getScorePercentage());
        result.setDifficultyLevel(req.getDifficultyLevel());
        result.setDurationSeconds(req.getDurationSeconds());
        return examResultRepository.save(result);
    }

    public ExamResult saveExamResult(ExamResult examResult) {
        return examResultRepository.save(examResult);
    }

    public List<ExamResult> getResultsByUser(Long userId) {
        return examResultRepository.findByUserId(userId);
    }

    public List<ExamResult> getResultsByUserAndSubject(Long userId, String subject) {
        return examResultRepository.findByUserIdAndSubject(userId, subject);
    }

    public List<ExamResult> getLastFiveResults(Long userId) {
        return examResultRepository.findTop5ByUserIdOrderByExamDateDesc(userId);
    }

    public List<ExamResult> getAllResults() {
        return examResultRepository.findAll();
    }

    public ExamResult getResultById(Long id) {
        if (id == null) throw new IllegalArgumentException("id boş olamaz");
        return examResultRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sonuç bulunamadı: " + id));
    }
}