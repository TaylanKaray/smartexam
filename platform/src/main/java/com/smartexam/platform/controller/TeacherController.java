package com.smartexam.platform.controller;

import com.smartexam.platform.entity.GradeLevel;
import com.smartexam.platform.entity.Teacher;
import com.smartexam.platform.entity.Topic;
import com.smartexam.platform.service.TeacherService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/teachers")
@RequiredArgsConstructor
public class TeacherController {

    private final TeacherService teacherService;

    @GetMapping
    public ResponseEntity<List<Teacher>> getAllTeachers() {
        return ResponseEntity.ok(teacherService.getAllTeachers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Teacher> getTeacher(@PathVariable Long id) {
        return ResponseEntity.ok(teacherService.getTeacherById(id));
    }

    @GetMapping("/{id}/curriculum")
    public ResponseEntity<Map<String, List<Topic>>> getCurriculum(@PathVariable Long id) {
        return ResponseEntity.ok(teacherService.getCurriculumTree(id));
    }

    @GetMapping("/grade-levels")
    public ResponseEntity<List<GradeLevel>> getGradeLevels() {
        return ResponseEntity.ok(teacherService.getGradeLevels());
    }
}
