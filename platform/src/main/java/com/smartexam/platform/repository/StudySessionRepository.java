package com.smartexam.platform.repository;

import com.smartexam.platform.entity.StudySession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface StudySessionRepository extends JpaRepository<StudySession, Long> {
    List<StudySession> findByUserIdOrderByStartedAtDesc(Long userId);

    @Query("SELECT COALESCE(AVG(s.durationSeconds),0) FROM StudySession s WHERE s.userId = :userId AND s.completed = true")
    Double avgDurationByUser(Long userId);

    @Query("SELECT COUNT(s) FROM StudySession s WHERE s.userId = :userId AND s.completed = true")
    Long countCompletedByUser(Long userId);
}
