package com.studymate.backend.controller;

import com.studymate.backend.entity.Document;
import com.studymate.backend.entity.QuizQuestion;
import com.studymate.backend.repository.DocumentRepository;
import com.studymate.backend.service.CloudinaryService;
import com.studymate.backend.service.GroqService;
import com.studymate.backend.service.PdfExtractionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin // Handled globally by CorsConfig patterns
public class DocumentController {

    private final DocumentRepository documentRepository;
    private final CloudinaryService cloudinaryService;
    private final PdfExtractionService pdfExtractionService;
    private final GroqService groqService;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadDocument(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Please select a file to upload.");
        }

        if (!"application/pdf".equalsIgnoreCase(file.getContentType()) && 
            !file.getOriginalFilename().toLowerCase().endsWith(".pdf")) {
            return ResponseEntity.badRequest().body("Only PDF files are supported.");
        }

        try {
            String title = file.getOriginalFilename();
            // Remove the extension from the title if present
            if (title != null && title.contains(".")) {
                title = title.substring(0, title.lastIndexOf("."));
            }

            // 1. Upload to Cloudinary
            String cloudinaryUrl = cloudinaryService.uploadPdf(file);

            // 2. Extract Text from PDF
            String extractedText = pdfExtractionService.extractText(file);

            // 3. Generate Summary using Groq
            String summary = groqService.generateSummary(title, extractedText);

            // 4. Create and save Document Entity (empty questions initially)
            Document document = Document.builder()
                    .title(title)
                    .cloudinaryUrl(cloudinaryUrl)
                    .summary(summary)
                    .extractedText(extractedText) // Cache raw text for generating quiz later
                    .build();

            Document savedDocument = documentRepository.save(document);
            log.info("Document saved successfully with ID: {}", savedDocument.getId());

            return ResponseEntity.ok(savedDocument);

        } catch (Exception e) {
            log.error("Error processing document upload", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("An error occurred during PDF processing: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/generate-quiz")
    public ResponseEntity<?> generateQuiz(@PathVariable("id") Long id) {
        Optional<Document> docOpt = documentRepository.findById(id);
        if (docOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Document document = docOpt.get();

        // If quiz was already generated, return the existing ones
        if (document.getQuestions() != null && !document.getQuestions().isEmpty()) {
            return ResponseEntity.ok(document.getQuestions());
        }

        try {
            log.info("Generating practice quiz on demand for document: {}", document.getTitle());
            String textForQuiz = document.getExtractedText();
            if (textForQuiz == null || textForQuiz.trim().isEmpty()) {
                textForQuiz = document.getSummary();
            }
            List<QuizQuestion> questions = groqService.generateQuiz(document.getTitle(), textForQuiz);

            // Link questions back to document and add to existing tracked collection
            document.getQuestions().clear();
            for (QuizQuestion question : questions) {
                question.setDocument(document);
                document.getQuestions().add(question);
            }

            Document savedDocument = documentRepository.save(document);
            log.info("Quiz generated and saved for Document ID: {}", savedDocument.getId());

            return ResponseEntity.ok(savedDocument.getQuestions());
        } catch (Exception e) {
            log.error("Failed to generate quiz for document ID: " + id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("An error occurred during quiz generation: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<Document>> getAllDocuments() {
        try {
            List<Document> documents = documentRepository.findAll();
            // Sort by ID / CreatedAt descending to show latest first
            documents.sort((d1, d2) -> d2.getId().compareTo(d1.getId()));
            return ResponseEntity.ok(documents);
        } catch (Exception e) {
            log.error("Error listing documents", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Document> getDocumentById(@PathVariable("id") Long id) {
        Optional<Document> document = documentRepository.findById(id);
        return document.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDocument(@PathVariable("id") Long id) {
        if (!documentRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        try {
            documentRepository.deleteById(id);
            log.info("Deleted document with ID: {}", id);
            return ResponseEntity.ok().body("Document deleted successfully.");
        } catch (Exception e) {
            log.error("Error deleting document with ID: " + id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to delete document.");
        }
    }
}
