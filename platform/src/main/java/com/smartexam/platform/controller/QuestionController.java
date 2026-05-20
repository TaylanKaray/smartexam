package com.smartexam.platform.controller;

import com.smartexam.platform.entity.Question;
import com.smartexam.platform.service.QuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/questions")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;

    @GetMapping
    public ResponseEntity<List<Question>> getAllQuestions() {
        return ResponseEntity.ok(questionService.getAllQuestions());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Question> getQuestionById(@PathVariable Long id) {
        return ResponseEntity.ok(questionService.getQuestionById(id));
    }

    @GetMapping("/subject/{subject}")
    public ResponseEntity<List<Question>> getBySubject(@PathVariable String subject) {
        return ResponseEntity.ok(questionService.getQuestionsBySubject(subject));
    }

    @GetMapping("/subject/{subject}/difficulty/{difficulty}")
    public ResponseEntity<List<Question>> getBySubjectAndDifficulty(
            @PathVariable String subject,
            @PathVariable Integer difficulty) {
        return ResponseEntity.ok(questionService.getQuestionsBySubjectAndDifficulty(subject, difficulty));
    }

    @PostMapping
    public ResponseEntity<Question> createQuestion(@RequestBody Question question) {
        return ResponseEntity.ok(questionService.createQuestion(question));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Question> updateQuestion(@PathVariable Long id, @RequestBody Question question) {
        return ResponseEntity.ok(questionService.updateQuestion(id, question));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable Long id) {
        questionService.deleteQuestion(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/bulk-import")
    public ResponseEntity<Map<String, Object>> bulkImport(@RequestBody List<Map<String, Object>> questions) {
        return ResponseEntity.ok(questionService.bulkImport(questions));
    }
}