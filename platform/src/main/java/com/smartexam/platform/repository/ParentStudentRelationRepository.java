package com.smartexam.platform.repository;

import com.smartexam.platform.entity.ParentStudentRelation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ParentStudentRelationRepository extends JpaRepository<ParentStudentRelation, Long> {
    Optional<ParentStudentRelation> findByParentId(Long parentId);
    List<ParentStudentRelation> findAllByStudentId(Long studentId); // mentor için
    boolean existsByParentIdAndStudentId(Long parentId, Long studentId);
}
