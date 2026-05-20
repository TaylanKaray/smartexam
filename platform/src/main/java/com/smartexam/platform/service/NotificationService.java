package com.smartexam.platform.service;

import com.smartexam.platform.entity.*;
import com.smartexam.platform.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final TopicRepository topicRepository;

    /** Her gün 08:00'de çalışır — zamanı gelen bildirimleri "gönderildi" işaretle */
    @Scheduled(cron = "0 0 8 * * *")
    public void processScheduledNotifications() {
        List<Notification> pending = notificationRepository
                .findByIsSentFalseAndScheduledDateLessThanEqual(LocalDate.now());
        for (Notification n : pending) {
            n.setIsSent(true);
            notificationRepository.save(n);
        }
    }

    /** Kullanıcının okunmamış bildirimlerini döner */
    public List<Notification> getUnread(Long userId) {
        if (userId == null) return List.of();
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
    }

    /** Bildirimi okundu işaretle */
    public void markRead(Long notificationId) {
        if (notificationId == null) return;
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setIsRead(true);
            notificationRepository.save(n);
        });
    }

    /** Zayıf konu bildirimi oluştur (karma testten sonra çağrılır) */
    public Notification createWeaknessNotification(Long userId, Long topicId, String topicName) {
        if (userId == null) throw new IllegalArgumentException("userId cannot be null");
        User user = userRepository.findById(userId).orElseThrow();
        Notification n = new Notification();
        n.setUser(user);
        if (topicId != null) topicRepository.findById(topicId).ifPresent(n::setTopic);
        n.setMessage(topicName + " konusunda zorlanıyorsun. Konu eksiğin var gibi görünüyor.");
        n.setType("TOPIC_WEAKNESS");
        n.setScheduledDate(LocalDate.now());
        n.setIsSent(true);
        return notificationRepository.save(n);
    }
}
