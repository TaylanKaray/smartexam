package com.smartexam.platform.service;

import com.smartexam.platform.dto.AiPredictResponse;
import com.smartexam.platform.entity.AiRecommendation;
import com.smartexam.platform.entity.User;
import com.smartexam.platform.repository.AiRecommendationRepository;
import com.smartexam.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AiRecommendationService {

    private final AiRecommendationRepository aiRecommendationRepository;
    private final UserRepository userRepository;

    public AiRecommendation saveFromPrediction(Long userId, String subject, AiPredictResponse prediction) {
        if (userId == null) throw new IllegalArgumentException("userId boş olamaz");
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı: " + userId));
        AiRecommendation rec = new AiRecommendation();
        rec.setUser(user);
        rec.setSubject(subject);
        rec.setRecommendedDifficulty(prediction.getLevel());
        rec.setConfidenceScore(prediction.getConfidence());
        return aiRecommendationRepository.save(rec);
    }

    public List<AiRecommendation> getRecommendationsByUser(Long userId) {
        return aiRecommendationRepository.findByUserId(userId);
    }

    public AiRecommendation getLatestRecommendation(Long userId, String subject) {
        List<AiRecommendation> list = aiRecommendationRepository
                .findTop1ByUserIdAndSubjectOrderByRecommendedAtDesc(userId, subject);
        return list.isEmpty() ? null : list.get(0);
    }
}