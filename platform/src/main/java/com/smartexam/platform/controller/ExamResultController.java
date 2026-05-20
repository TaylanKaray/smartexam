package com.smartexam.platform.controller;

import com.smartexam.platform.dto.ExamResultRequest;
import com.smartexam.platform.entity.ExamResult;
import com.smartexam.platform.service.ExamResultService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exam-results")
@RequiredArgsConstructor
public class ExamResultController {

    private final ExamResultService examResultService;

    @PostMapping
    public ResponseEntity<ExamResult> saveResult(@RequestBody ExamResultRequest req) {
        return ResponseEntity.ok(examResultService.saveFromRequest(req));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ExamResult>> getResultsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(examResultService.getResultsByUser(userId));
    }

    @GetMapping("/user/{userId}/subject/{subject}")
    public ResponseEntity<List<ExamResult>> getResultsByUserAndSubject(
            @PathVariable Long userId,
            @PathVariable String subject) {
        return ResponseEntity.ok(examResultService.getResultsByUserAndSubject(userId, subject));
    }

    @GetMapping("/user/{userId}/last5")
    public ResponseEntity<List<ExamResult>> getLastFiveResults(@PathVariable Long userId) {
        return ResponseEntity.ok(examResultService.getLastFiveResults(userId));
    }

    @GetMapping("/all")
    public ResponseEntity<List<ExamResult>> getAllResults() {
        return ResponseEntity.ok(examResultService.getAllResults());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExamResult> getResultById(@PathVariable Long id) {
        return ResponseEntity.ok(examResultService.getResultById(id));
    }
}