package com.smartexam.platform.service;

import com.smartexam.platform.entity.*;
import com.smartexam.platform.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TopicMasteryService {

    private final TopicMasteryRepository masteryRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final TopicRepository topicRepository;

    private static final double WEAKNESS_THRESHOLD = 50.0;

    /**
     * Karma test içindeki soruları konu bazlı gruplar,
     * topic_mastery günceller ve zayıf konular için bildirim üretir.
     */
    @Transactional
    public List<Map<String, Object>> updateFromMixedExam(Long userId, List<QuestionAttempt> attempts) {
        if (userId == null || attempts.isEmpty()) return List.of();

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return List.of();

        // Konu bazlı gruplama
        Map<Long, List<QuestionAttempt>> byTopic = attempts.stream()
                .filter(a -> a.getQuestion() != null && a.getQuestion().getTopic() != null)
                .collect(Collectors.groupingBy(a -> a.getQuestion().getTopic().getId()));

        List<Map<String, Object>> weakTopics = new ArrayList<>();

        for (Map.Entry<Long, List<QuestionAttempt>> entry : byTopic.entrySet()) {
            Long topicId = entry.getKey();
            List<QuestionAttempt> topicAttempts = entry.getValue();

            long correct = topicAttempts.stream().filter(a -> Boolean.TRUE.equals(a.getIsCorrect())).count();
            double score = (double) correct / topicAttempts.size() * 100;

            // topic_mastery güncelle
            TopicMastery mastery = masteryRepository.findByUserIdAndTopicId(userId, topicId)
                    .orElseGet(() -> {
                        TopicMastery m = new TopicMastery();
                        m.setUser(user);
                        topicRepository.findById(topicId).ifPresent(m::setTopic);
                        return m;
                    });

            mastery.setTotalAttempts(mastery.getTotalAttempts() + topicAttempts.size());
            mastery.setCorrectCount(mastery.getCorrectCount() + (int) correct);
            int total = mastery.getTotalAttempts();
            mastery.setMasteryScore(total > 0 ? (double) mastery.getCorrectCount() / total * 100 : 0.0);
            mastery.setLastUpdated(LocalDateTime.now());
            masteryRepository.save(mastery);

            // Zayıf konu → bildirim oluştur
            if (score < WEAKNESS_THRESHOLD && mastery.getTopic() != null) {
                String topicName = mastery.getTopic().getName();
                Map<String, Object> weak = new HashMap<>();
                weak.put("topicId", topicId);
                weak.put("topicName", topicName);
                weak.put("score", Math.round(score));
                weak.put("questionCount", topicAttempts.size());
                weakTopics.add(weak);
            }
        }

        return weakTopics;
    }

    public void scheduleReminder(Long userId, Long topicId, int daysLater) {
        if (userId == null) throw new IllegalArgumentException("userId cannot be null");
        if (topicId == null) throw new IllegalArgumentException("topicId cannot be null");
        User user = userRepository.findById(userId).orElseThrow();
        Topic topic = topicRepository.findById(topicId).orElseThrow();

        Notification n = new Notification();
        n.setUser(user);
        n.setTopic(topic);
        n.setMessage(topic.getName() + " konusunu tekrar etme zamanı geldi!");
        n.setType("SCHEDULED_REMINDER");
        n.setScheduledDate(LocalDate.now().plusDays(daysLater));
        notificationRepository.save(n);
    }

    public List<TopicMastery> getUserMastery(Long userId) {
        return masteryRepository.findByUserId(userId);
    }
}
