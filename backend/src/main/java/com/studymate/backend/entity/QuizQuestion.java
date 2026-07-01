package com.studymate.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "quiz_questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    @JsonIgnore
    private Document document;

    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "quiz_question_options", joinColumns = @JoinColumn(name = "quiz_question_id"))
    @Column(name = "option_text", nullable = false, length = 512)
    @Builder.Default
    private List<String> options = new ArrayList<>();

    @Column(name = "correct_option_index", nullable = false)
    private int correctOptionIndex;

    @Column(name = "explanation", columnDefinition = "TEXT")
    private String explanation;
}
