package com.smartexam.platform.service;

import com.smartexam.platform.entity.Course;
import com.smartexam.platform.entity.LessonContent;
import com.smartexam.platform.entity.Topic;
import com.smartexam.platform.repository.CourseRepository;
import com.smartexam.platform.repository.LessonContentRepository;
import com.smartexam.platform.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final TopicRepository topicRepository;
    private final LessonContentRepository lessonContentRepository;

    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    public List<Topic> getTopicsByCourse(Long courseId) {
        return topicRepository.findByCourseIdOrderByOrderIndex(courseId);
    }

    public List<LessonContent> getContentsByTopic(Long topicId) {
        return lessonContentRepository.findByTopicId(topicId);
    }

    public Topic getTopicById(Long topicId) {
        if (topicId == null) throw new IllegalArgumentException("topicId boş olamaz");
        return topicRepository.findById(topicId)
                .orElseThrow(() -> new RuntimeException("Konu bulunamadı: " + topicId));
    }

    public Course addCourse(String name, String description, String icon) {
        Course course = new Course();
        course.setName(name);
        course.setDescription(description);
        course.setIcon(icon != null ? icon : "book");
        return courseRepository.save(course);
    }

    public Topic addTopic(Long courseId, String name) {
        if (courseId == null) throw new IllegalArgumentException("courseId boş olamaz");
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Ders bulunamadı: " + courseId));
        int orderIndex = topicRepository.findByCourseIdOrderByOrderIndex(courseId).size() + 1;
        Topic topic = new Topic();
        topic.setCourse(course);
        topic.setName(name);
        topic.setOrderIndex(orderIndex);
        return topicRepository.save(topic);
    }

    public LessonContent addContent(Long topicId, String type, String title, String url, Integer durationMinutes) {
        if (topicId == null) throw new IllegalArgumentException("topicId boş olamaz");
        Topic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new RuntimeException("Konu bulunamadı: " + topicId));
        LessonContent content = new LessonContent();
        content.setTopic(topic);
        content.setType(type);
        content.setTitle(title);
        content.setUrl(url);
        content.setDurationMinutes(durationMinutes);
        return lessonContentRepository.save(content);
    }
}
