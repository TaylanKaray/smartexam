package com.smartexam.platform.controller;

import com.smartexam.platform.entity.StudySession;
import com.smartexam.platform.repository.StudySessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/study-sessions")
@RequiredArgsConstructor
public class StudySessionController {

    private final StudySessionRepository repo;

    @PostMapping
    public ResponseEntity<StudySession> save(@RequestBody StudySession session) {
        return ResponseEntity.ok(repo.save(session));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<StudySession>> getUserSessions(@PathVariable Long userId) {
        return ResponseEntity.ok(repo.findByUserIdOrderByStartedAtDesc(userId));
    }

    @GetMapping("/user/{userId}/stats")
    public ResponseEntity<Map<String, Object>> getStats(@PathVariable Long userId) {
        double avgSec   = repo.avgDurationByUser(userId);
        long   total    = repo.countCompletedByUser(userId);
        double avgMin   = Math.round(avgSec / 60.0 * 10) / 10.0;

        String aiTip = null;
        if (total >= 3) {
            if (avgSec < 900)      // < 15 dk
                aiTip = "Veri analizimize göre kısa seanslar çalışıyorsun. 25 dakikalık Pomodoro periyotlarında netlerin %15 daha yüksek olabileceğini gösteriyor!";
            else if (avgSec >= 1500) // >= 25 dk
                aiTip = "Harika! 25 dakikalık odaklanma seansların devam ediyor. Bu ritmi koruyarak verimliliğini zirveye taşıyabilirsin.";
            else
                aiTip = "Odaklanma seansların iyi gidiyor. Tutarlılık başarının anahtarı!";
        }

        return ResponseEntity.ok(Map.of(
                "totalSessions", total,
                "avgMinutes",    avgMin,
                "aiTip",         aiTip != null ? aiTip : ""
        ));
    }
}
