package com.smartexam.platform.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/practice-exams")
@RequiredArgsConstructor
public class PracticeExamController {

    private final JdbcTemplate jdbc;

    /** Tüm deneme sınavlarını listele */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> list(
            @RequestParam(required = false) String pkg) {

        String sql = pkg != null
                ? "SELECT id,title,category,package_type,year,total_questions,duration_minutes,description FROM practice_exams WHERE package_type=? ORDER BY category,year DESC NULLS LAST"
                : "SELECT id,title,category,package_type,year,total_questions,duration_minutes,description FROM practice_exams ORDER BY category,year DESC NULLS LAST";

        List<Map<String, Object>> rows = pkg != null
                ? jdbc.queryForList(sql, pkg)
                : jdbc.queryForList(sql);
        return ResponseEntity.ok(rows);
    }

    /** Sınava ait soruları getir */
    @GetMapping("/{examId}/questions")
    public ResponseEntity<List<Map<String, Object>>> getQuestions(
            @PathVariable Long examId) {

        String sql = """
                SELECT q.id, q.question_text,
                       q.optiona AS option_a, q.optionb AS option_b,
                       q.optionc AS option_c, q.optiond AS option_d,
                       q.optione AS option_e,
                       q.correct_answer, q.subject, q.difficulty_level, peq.order_index
                FROM practice_exam_questions peq
                JOIN questions q ON q.id = peq.question_id
                WHERE peq.practice_exam_id = ?
                ORDER BY peq.order_index
                """;
        return ResponseEntity.ok(jdbc.queryForList(sql, examId));
    }

    /** Sınav meta bilgisini getir */
    @GetMapping("/{examId}")
    public ResponseEntity<Map<String, Object>> getExam(@PathVariable Long examId) {
        String sql = "SELECT id,title,category,package_type,year,total_questions,duration_minutes,description FROM practice_exams WHERE id=?";
        List<Map<String, Object>> rows = jdbc.queryForList(sql, examId);
        if (rows.isEmpty()) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(rows.get(0));
    }
}
