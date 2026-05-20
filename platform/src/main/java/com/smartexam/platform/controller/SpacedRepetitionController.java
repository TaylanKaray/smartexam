package com.smartexam.platform.controller;

import com.smartexam.platform.entity.SpacedRepetition;
import com.smartexam.platform.service.SpacedRepetitionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/spaced-repetition")
@RequiredArgsConstructor
public class SpacedRepetitionController {

    private final SpacedRepetitionService spacedRepService;

    @GetMapping("/today/{userId}")
    public ResponseEntity<List<SpacedRepetition>> getTodayReviews(@PathVariable Long userId) {
        return ResponseEntity.ok(spacedRepService.getTodayReviews(userId));
    }

    @GetMapping("/all/{userId}")
    public ResponseEntity<List<SpacedRepetition>> getAllScheduled(@PathVariable Long userId) {
        return ResponseEntity.ok(spacedRepService.getAllScheduled(userId));
    }

    @GetMapping("/overdue/{userId}")
    public ResponseEntity<List<SpacedRepetition>> getOverdue(@PathVariable Long userId) {
        // Bugün ve öncesini kapsayan — öğretmene "takip edilmesi gereken" öğrenciler
        return ResponseEntity.ok(spacedRepService.getTodayReviews(userId));
    }
}
