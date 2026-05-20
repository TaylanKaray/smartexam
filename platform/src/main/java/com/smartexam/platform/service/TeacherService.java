package com.smartexam.platform.service;

import com.smartexam.platform.entity.GradeLevel;
import com.smartexam.platform.entity.Teacher;
import com.smartexam.platform.entity.Topic;
import com.smartexam.platform.repository.GradeLevelRepository;
import com.smartexam.platform.repository.TeacherRepository;
import com.smartexam.platform.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeacherService {

    private final TeacherRepository teacherRepository;
    private final TopicRepository topicRepository;
    private final GradeLevelRepository gradeLevelRepository;

    public List<Teacher> getAllTeachers() {
        return teacherRepository.findAll();
    }

    public Teacher getTeacherById(Long id) {
        if (id == null) throw new IllegalArgumentException("id boş olamaz");
        return teacherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Öğretmen bulunamadı: " + id));
    }

    /** Öğretmenin branch'ine göre tüm konuları döner */
    public Map<String, List<Topic>> getCurriculumTree(Long teacherId) {
        Teacher teacher = getTeacherById(teacherId);
        List<Topic> topics = topicRepository.findAll().stream()
                .filter(t -> t.getCourse() != null
                        && t.getCourse().getName().equals(teacher.getBranch()))
                .collect(Collectors.toList());
        return Map.of("Tüm Konular", topics);
    }

    public List<GradeLevel> getGradeLevels() {
        return gradeLevelRepository.findAll();
    }
}
