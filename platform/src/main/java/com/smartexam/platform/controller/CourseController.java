package com.smartexam.platform.controller;

import com.smartexam.platform.entity.Course;
import com.smartexam.platform.entity.LessonContent;
import com.smartexam.platform.entity.Topic;
import com.smartexam.platform.repository.QuestionAttemptRepository;
import com.smartexam.platform.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;
    private final QuestionAttemptRepository questionAttemptRepository;

    @GetMapping
    public ResponseEntity<List<Course>> getAllCourses() {
        return ResponseEntity.ok(courseService.getAllCourses());
    }

    @GetMapping("/{courseId}/topics")
    public ResponseEntity<List<Topic>> getTopics(@PathVariable Long courseId) {
        return ResponseEntity.ok(courseService.getTopicsByCourse(courseId));
    }

    @GetMapping("/topics/{topicId}/contents")
    public ResponseEntity<List<LessonContent>> getContents(@PathVariable Long topicId) {
        return ResponseEntity.ok(courseService.getContentsByTopic(topicId));
    }

    @GetMapping("/topics/{topicId}")
    public ResponseEntity<Topic> getTopic(@PathVariable Long topicId) {
        return ResponseEntity.ok(courseService.getTopicById(topicId));
    }

    // Kullanıcının konu bazlı ilerleme istatistiği
    // { topicId -> { total, correct, percent } }
    @GetMapping("/progress/user/{userId}")
    public ResponseEntity<Map<Long, Map<String, Object>>> getUserProgress(@PathVariable Long userId) {
        List<Object[]> rows = questionAttemptRepository.findTopicProgressByUser(userId);
        Map<Long, Map<String, Object>> result = new HashMap<>();
        for (Object[] row : rows) {
            Long topicId  = ((Number) row[0]).longValue();
            Long courseId = ((Number) row[1]).longValue();
            long total    = ((Number) row[2]).longValue();
            long correct  = ((Number) row[3]).longValue();
            int percent   = total > 0 ? (int) Math.round((double) correct / total * 100) : 0;
            result.put(topicId, Map.of("total", total, "correct", correct, "percent", percent, "courseId", courseId));
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<Course> addCourse(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(courseService.addCourse(body.get("name"), body.get("description"), body.get("icon")));
    }

    @PostMapping("/topics")
    public ResponseEntity<Topic> addTopic(@RequestBody Map<String, Object> body) {
        Long courseId = Long.valueOf(body.get("courseId").toString());
        String name = body.get("name").toString();
        return ResponseEntity.ok(courseService.addTopic(courseId, name));
    }

    @PostMapping("/contents")
    public ResponseEntity<LessonContent> addContent(@RequestBody Map<String, Object> body) {
        Long topicId = Long.valueOf(body.get("topicId").toString());
        String type = body.get("type").toString();
        String title = body.get("title").toString();
        String url = body.get("url").toString();
        Integer duration = body.get("durationMinutes") != null
                ? Integer.valueOf(body.get("durationMinutes").toString()) : null;
        return ResponseEntity.ok(courseService.addContent(topicId, type, title, url, duration));
    }
}
