package com.smartexam.platform.service;

import com.smartexam.platform.entity.Badge;
import com.smartexam.platform.entity.User;
import com.smartexam.platform.entity.UserBadge;
import com.smartexam.platform.repository.BadgeRepository;
import com.smartexam.platform.repository.ExamResultRepository;
import com.smartexam.platform.repository.UserBadgeRepository;
import com.smartexam.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BadgeService {

    private final BadgeRepository badgeRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final UserRepository userRepository;
    private final ExamResultRepository examResultRepository;

    public List<UserBadge> getUserBadges(Long userId) {
        return userBadgeRepository.findByUserId(userId);
    }

    /** Sınav sonrasında rozet kontrolü — yeni kazanılan rozetleri döner */
    public List<Badge> checkAndAwardBadges(Long userId, double score, int difficultyLevel, long durationSec) {
        if (userId == null) return List.of();
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return List.of();

        List<Badge> earned = new ArrayList<>();
        var results = examResultRepository.findByUserId(userId);

        // İLK SINAV
        if (results.size() == 1) award(user, "FIRST_EXAM", null, earned);

        // MÜKEMMEL SKOR
        if (score >= 100) award(user, "PERFECT_SCORE", null, earned);

        // ZOR SEVIYE USTALIGI
        if (difficultyLevel == 3 && score >= 80) award(user, "HARD_MASTER", null, earned);

        // HIZ TRENİ
        if (durationSec <= 180 && score > 0) award(user, "SPEED_DEMON", null, earned);

        // ÜST ÜSTE 3
        if (results.size() >= 3) {
            var last3 = results.subList(results.size() - 3, results.size());
            if (last3.stream().allMatch(r -> r.getScorePercentage() >= 70))
                award(user, "STREAK_3", null, earned);
        }

        // AZİMLİ ÖĞRENCİ — 10+ sınav
        if (results.size() >= 10) award(user, "EXAM_COUNT", null, earned);

        // KONU FATİHİ — zor seviyede %50+
        if (difficultyLevel == 3 && score >= 50) award(user, "ZOR_PASSED", null, earned);

        // İLERLEYEN YILDIZ — 5 farklı konuyu geçtiyse
        long passedTopics = results.stream()
                .filter(r -> r.getTopicId() != null && r.getScorePercentage() >= 50)
                .map(r -> r.getTopicId()).distinct().count();
        if (passedTopics >= 5) award(user, "TOPICS_PASSED", null, earned);

        // DERS BAZLI BAŞARI — o derste %80+ sınav
        if (score >= 80 && !results.isEmpty()) {
            String subject = results.get(results.size() - 1).getSubject();
            if (subject != null) award(user, "SUBJECT_SCORE", subject, earned);
        }

        return earned;
    }

    private void award(User user, String conditionType, String conditionValue, List<Badge> earned) {
        boolean alreadyHas = conditionValue != null
                ? userBadgeRepository.existsByUserIdAndBadgeConditionTypeAndBadgeConditionValue(user.getId(), conditionType, conditionValue)
                : userBadgeRepository.existsByUserIdAndBadgeConditionType(user.getId(), conditionType);
        if (alreadyHas) return;

        var badgeOpt = conditionValue != null
                ? badgeRepository.findByConditionTypeAndConditionValue(conditionType, conditionValue)
                : badgeRepository.findByConditionType(conditionType);

        badgeOpt.ifPresent(badge -> {
            UserBadge ub = new UserBadge();
            ub.setUser(user);
            ub.setBadge(badge);
            userBadgeRepository.save(ub);
            earned.add(badge);
        });
    }
}
