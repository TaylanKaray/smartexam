package com.smartexam.platform.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "grade_levels")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class GradeLevel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String label;
}
