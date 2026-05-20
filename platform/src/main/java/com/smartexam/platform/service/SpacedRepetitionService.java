package com.smartexam.platform.service;

import com.smartexam.platform.entity.SpacedRepetition;
import com.smartexam.platform.entity.Topic;
import com.smartexam.platform.entity.User;
import com.smartexam.platform.repository.SpacedRepetitionRepository;
import com.smartexam.platform.repository.TopicRepository;
import com.smartexam.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SpacedRepetitionService {

    private final SpacedRepetitionRepository spacedRepRepo;
    private final UserRepository userRepository;
    private final TopicRepository topicRepository;

    // Unutma eğrisi aralıkları: 3 → 7 → 14 → 30 gün
    private static final int[] INTERVALS = {3, 7, 14, 30};

    /** Bugün ve geçmiş tekrar yapılacak konuları döner */
    public List<SpacedRepetition> getTodayReviews(Long userId) {
        return spacedRepRepo.findByUserIdAndNextReviewDateLessThanEqual(userId, LocalDate.now());
    }

    public List<SpacedRepetition> getAllScheduled(Long userId) {
        return spacedRepRepo.findByUserId(userId);
    }

    /**
     * Sınav sonrası çağrılır.
     * - Başarılı (score>=70): sonraki aralığa geç
     * - Başarısız (score<70): 3 gün sonra tekrar
     */
    public void updateAfterExam(Long userId, Long topicId, double score) {
        if (userId == null || topicId == null) return;

        User user = userRepository.findById(userId).orElse(null);
        Topic topic = topicRepository.findById(topicId).orElse(null);
        if (user == null || topic == null) return;

        SpacedRepetition sr = spacedRepRepo.findByUserIdAndTopicId(userId, topicId)
                .orElseGet(() -> {
                    SpacedRepetition newSr = new SpacedRepetition();
                    newSr.setUser(user);
                    newSr.setTopic(topic);
                    newSr.setRepetitionCount(0);
                    newSr.setIntervalDays(3);
                    return newSr;
                });

        if (score >= 70) {
            // Başarılı → sonraki aralık
            int nextIdx = Math.min(sr.getRepetitionCount(), INTERVALS.length - 1);
            sr.setIntervalDays(INTERVALS[nextIdx]);
            sr.setRepetitionCount(sr.getRepetitionCount() + 1);
        } else {
            // Başarısız → başa dön, 3 gün sonra
            sr.setIntervalDays(3);
            sr.setRepetitionCount(0);
        }

        sr.setNextReviewDate(LocalDate.now().plusDays(sr.getIntervalDays()));
        spacedRepRepo.save(sr);
    }
}
