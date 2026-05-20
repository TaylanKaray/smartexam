package com.smartexam.platform.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "parent_student_relations")
@Getter @Setter @NoArgsConstructor
public class ParentStudentRelation {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "parent_id",  nullable = false) private Long parentId;
    @Column(name = "student_id", nullable = false) private Long studentId;
    @Column(name = "created_at") private LocalDateTime createdAt = LocalDateTime.now();
}
