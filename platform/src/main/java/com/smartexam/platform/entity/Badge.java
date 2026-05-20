package com.smartexam.platform.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "badges")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class Badge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    private String description;

    @Column(nullable = false)
    private String icon;

    @Column(name = "condition_type", nullable = false)
    private String conditionType;

    @Column(name = "condition_value")
    private String conditionValue;
}
