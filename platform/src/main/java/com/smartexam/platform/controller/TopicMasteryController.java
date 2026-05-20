package com.smartexam.platform.controller;

import com.smartexam.platform.entity.TopicMastery;
import com.smartexam.platform.repository.TopicMasteryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/topic-mastery")
@RequiredArgsConstructor
public class TopicMasteryController {

    private final TopicMasteryRepository repo;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getUserMastery(@PathVariable Long userId) {
        List<TopicMastery> masteries = repo.findByUserId(userId);

        List<Map<String, Object>> result = masteries.stream()
                .map(m -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("topicId",      m.getTopic() != null ? m.getTopic().getId() : null);
                    map.put("topicName",    m.getTopic() != null ? m.getTopic().getName() : "");
                    map.put("courseName",   m.getTopic() != null && m.getTopic().getCourse() != null
                            ? m.getTopic().getCourse().getName() : "");
                    map.put("masteryScore", m.getMasteryScore() != null ? Math.round(m.getMasteryScore()) : 0);
                    map.put("totalAttempts",m.getTotalAttempts());
                    map.put("correctCount", m.getCorrectCount());
                    return map;
                })
                .sorted(Comparator.comparingLong(m -> (long)(Integer) m.get("masteryScore")))
                .toList();

        return ResponseEntity.ok(result);
    }
}
