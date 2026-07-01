package com.studymate.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
@Slf4j
public class PdfExtractionService {

    private static final int MAX_CHAR_LIMIT = 50000; // Limit to ~10,000 words to avoid LLM token overflow and long waits

    public String extractText(MultipartFile file) throws IOException {
        log.info("Extracting text from PDF: {} (size: {} bytes)", file.getOriginalFilename(), file.getSize());
        
        String extractedText;
        try (PDDocument document = Loader.loadPDF(file.getBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            // Optional: Sort text by position to ensure reading order
            stripper.setSortByPosition(true);
            extractedText = stripper.getText(document);
        } catch (Exception e) {
            log.error("Failed to parse PDF file using Apache PDFBox", e);
            throw new IOException("Could not parse PDF document: " + e.getMessage(), e);
        }

        if (extractedText == null || extractedText.trim().isEmpty()) {
            log.warn("Extracted text is empty. PDF might be scanned or image-only.");
            throw new IOException("The PDF file contains no readable text. It might be scanned or containing only images.");
        }

        // Basic cleaning
        extractedText = extractedText.replaceAll("\\r\\n", "\n")
                                     .replaceAll("\\r", "\n")
                                     .replaceAll("[ \\t]+", " "); // collapse horizontal whitespaces
        
        int length = extractedText.length();
        log.info("Successfully extracted {} characters from PDF.", length);

        if (length > MAX_CHAR_LIMIT) {
            log.warn("Extracted text exceeds character limit ({}). Truncating to {} characters.", length, MAX_CHAR_LIMIT);
            extractedText = extractedText.substring(0, MAX_CHAR_LIMIT) + "\n\n... [Content Truncated due to size limits] ...";
        }

        return extractedText.trim();
    }
}
