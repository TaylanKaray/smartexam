package com.smartexam.platform.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "questions")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String questionText;

    private String optionA;
    private String optionB;
    private String optionC;
    private String optionD;

    private String correctAnswer;

    @Column(nullable = false)
    private String subject;

    @Column(nullable = false)
    private Integer difficultyLevel;

    // Kolay=1.0, Orta=1.5, Zor=2.0
    @Column(name = "weight_coefficient")
    private Double weightCoefficient = 1.0;

    // "MCQ" veya "FILL_BLANK"
    @Column(name = "question_type", length = 20)
    private String questionType = "MCQ";

    // Boşluklu metin: "Mitoz bölünme ___ evresinde gerçekleşir."
    @Column(name = "answer_template", columnDefinition = "TEXT")
    private String answerTemplate;

    // Doğru doldurulan cevap (küçük harf karşılaştırması yapılır)
    @Column(name = "blank_answer")
    private String blankAnswer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "contents", "course"})
    private Topic topic;
}
