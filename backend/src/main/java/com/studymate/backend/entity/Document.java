package com.studymate.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "documents")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(name = "cloudinary_url", nullable = false, length = 1024)
    private String cloudinaryUrl;

    @Lob
    @Column(name = "summary", columnDefinition = "TEXT")
    private String summary;

    @Lob
    @Column(name = "extracted_text", columnDefinition = "TEXT")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private String extractedText;

    @OneToMany(mappedBy = "document", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<QuizQuestion> questions = new ArrayList<>();

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
