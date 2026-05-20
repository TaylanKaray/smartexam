package com.smartexam.platform.controller;

import com.smartexam.platform.entity.Notification;
import com.smartexam.platform.service.NotificationService;
import com.smartexam.platform.service.TopicMasteryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final TopicMasteryService topicMasteryService;

    @GetMapping("/unread/{userId}")
    public ResponseEntity<List<Notification>> getUnread(@PathVariable Long userId) {
        return ResponseEntity.ok(notificationService.getUnread(userId));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable Long id) {
        notificationService.markRead(id);
        return ResponseEntity.ok().build();
    }

    /** Zayıf konu için hatırlatıcı planla: { topicId, daysLater } */
    @PostMapping("/reminder/{userId}")
    public ResponseEntity<Void> scheduleReminder(
            @PathVariable Long userId,
            @RequestBody Map<String, Object> body) {
        Long topicId = Long.valueOf(body.get("topicId").toString());
        int daysLater = Integer.parseInt(body.get("daysLater").toString());
        topicMasteryService.scheduleReminder(userId, topicId, daysLater);
        return ResponseEntity.ok().build();
    }
}
