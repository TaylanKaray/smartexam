package com.smartexam.platform.controller;

import com.smartexam.platform.entity.SelfReport;
import com.smartexam.platform.entity.Topic;
import com.smartexam.platform.entity.User;
import com.smartexam.platform.repository.SelfReportRepository;
import com.smartexam.platform.repository.TopicRepository;
import com.smartexam.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/self-report")
@RequiredArgsConstructor
public class SelfReportController {

    private final SelfReportRepository selfReportRepository;
    private final UserRepository userRepository;
    private final TopicRepository topicRepository;

    @PostMapping
    public ResponseEntity<?> save(@RequestBody Map<String, Object> body) {
        Long userId = body.get("userId") != null ? Long.valueOf(body.get("userId").toString()) : null;
        Long topicId = body.get("topicId") != null ? Long.valueOf(body.get("topicId").toString()) : null;
        Integer rating = body.get("rating") != null ? Integer.valueOf(body.get("rating").toString()) : null;

        if (userId == null || topicId == null || rating == null)
            return ResponseEntity.badRequest().body("Eksik alan");

        User user = userRepository.findById(userId).orElseThrow();
        Topic topic = topicRepository.findById(topicId).orElseThrow();

        SelfReport report = new SelfReport();
        report.setUser(user);
        report.setTopic(topic);
        report.setRating(rating);
        selfReportRepository.save(report);

        return ResponseEntity.ok(Map.of("message", "Kaydedildi", "rating", rating));
    }
}
