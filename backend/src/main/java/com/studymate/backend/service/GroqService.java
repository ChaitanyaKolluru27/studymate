package com.studymate.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.studymate.backend.entity.QuizQuestion;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@Slf4j
public class GroqService {

    @Value("${groq.api-key:${GROQ_API_KEY:}}")
    private String apiKey;

    @Value("${groq.api-url:${GROQ_API_URL:https://api.groq.com/openai/v1/chat/completions}}")
    private String apiUrl;

    @Value("${groq.model:${GROQ_MODEL:llama-3.1-8b-instant}}")
    private String model;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private boolean useFallback = false;

    @PostConstruct
    public void init() {
        if (isConfigured()) {
            log.info("Groq service initialized with model: {}", model);
        } else {
            useFallback = true;
            log.warn("========================================================================");
            log.warn("GROQ API KEY IS NOT CONFIGRURED. Falling back to local mock generation.");
            log.warn("Please set GROQ_API_KEY in application.properties to enable real AI summarization.");
            log.warn("========================================================================");
        }
    }

    private boolean isConfigured() {
        return apiKey != null && !apiKey.trim().isEmpty() && !apiKey.contains("YOUR_GROQ_API_KEY");
    }

    /**
     * Summarizes the text content.
     */
    public String generateSummary(String title, String content) {
        if (useFallback) {
            log.info("[FALLBACK] Generating mock summary for document: {}", title);
            return generateMockSummary(title);
        }

        String systemPrompt = "You are a professional assistant. Summarize the following document content in a structured manner. Highlight key concepts, definitions, and main takeaways. Use clean Markdown formatting with bullet points and bold headers.";
        String userPrompt = String.format("Document Title: %s\n\nContent:\n%s", title, content);

        try {
            return callGroqApi(systemPrompt, userPrompt, false);
        } catch (Exception e) {
            log.error("Failed to generate summary via Groq API. Falling back to mock summary.", e);
            return generateMockSummary(title) + "\n\n*(Note: Groq API call failed: " + e.getMessage() + ". Showing mock summary fallback)*";
        }
    }

    /**
     * Generates a list of quiz questions from the text.
     */
    public List<QuizQuestion> generateQuiz(String title, String content) {
        if (useFallback) {
            log.info("[FALLBACK] Generating mock quiz for document: {}", title);
            return generateMockQuiz();
        }

        String systemPrompt = "You are an expert educator. Create a multiple choice quiz based ONLY on the provided text. The quiz must contain exactly 5 questions.\n" +
                "Each question must have:\n" +
                "1. 'questionText': the question itself.\n" +
                "2. 'options': an array of exactly 4 options (strings).\n" +
                "3. 'correctOptionIndex': integer (0, 1, 2, or 3) representing the index of the correct answer.\n" +
                "4. 'explanation': a clear explanation of why this option is correct and why the others are wrong.\n" +
                "You MUST return ONLY a JSON object matching this schema. Do not output any notes, markdown code blocks, thoughts, or wrappers outside the raw JSON object.\n" +
                "JSON Schema:\n" +
                "{\n" +
                "  \"questions\": [\n" +
                "    {\n" +
                "      \"questionText\": \"question text here\",\n" +
                "      \"options\": [\"opt A\", \"opt B\", \"opt C\", \"opt D\"],\n" +
                "      \"correctOptionIndex\": 0,\n" +
                "      \"explanation\": \"explanation text here\"\n" +
                "    }\n" +
                "  ]\n" +
                "}";
        
        String userPrompt = String.format("Document Title: %s\n\nContent:\n%s", title, content);

        try {
            String jsonResponse = callGroqApi(systemPrompt, userPrompt, true);
            return parseQuizQuestions(jsonResponse);
        } catch (Exception e) {
            log.error("Failed to generate quiz via Groq API. Falling back to mock quiz.", e);
            return generateMockQuiz();
        }
    }

    private String callGroqApi(String systemPrompt, String userPrompt, boolean forceJson) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + apiKey);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", model);
        requestBody.put("temperature", forceJson ? 0.4 : 0.3);

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));
        messages.add(Map.of("role", "user", "content", userPrompt));
        requestBody.put("messages", messages);

        if (forceJson) {
            requestBody.put("response_format", Map.of("type", "json_object"));
        }

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(apiUrl, entity, String.class);

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            JsonNode rootNode = objectMapper.readTree(response.getBody());
            String text = rootNode.path("choices").get(0).path("message").path("content").asText();
            return text.trim();
        } else {
            throw new RuntimeException("API response error: " + response.getStatusCode());
        }
    }

    private List<QuizQuestion> parseQuizQuestions(String jsonContent) {
        List<QuizQuestion> quizQuestions = new ArrayList<>();
        try {
            // Sometimes models wrap JSON in markdown block: ```json ... ```
            if (jsonContent.contains("```json")) {
                int start = jsonContent.indexOf("```json") + 7;
                int end = jsonContent.lastIndexOf("```");
                jsonContent = jsonContent.substring(start, end).trim();
            } else if (jsonContent.contains("```")) {
                int start = jsonContent.indexOf("```") + 3;
                int end = jsonContent.lastIndexOf("```");
                jsonContent = jsonContent.substring(start, end).trim();
            }

            JsonNode root = objectMapper.readTree(jsonContent);
            JsonNode questionsArray = root.path("questions");

            if (questionsArray.isArray()) {
                for (JsonNode qNode : questionsArray) {
                    String text = qNode.path("questionText").asText();
                    int correctIndex = qNode.path("correctOptionIndex").asInt(0);
                    
                    List<String> options = new ArrayList<>();
                    JsonNode optsArray = qNode.path("options");
                    if (optsArray.isArray()) {
                        for (JsonNode opt : optsArray) {
                            options.add(opt.asText());
                        }
                    }

                    if (!text.isEmpty() && !options.isEmpty()) {
                        QuizQuestion question = QuizQuestion.builder()
                                .questionText(text)
                                .options(options)
                                .correctOptionIndex(correctIndex)
                                .explanation(qNode.path("explanation").asText("No explanation provided."))
                                .build();
                        quizQuestions.add(question);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse quiz JSON content: " + jsonContent, e);
            // If parsing fails, fall back to generating a mock quiz rather than crashing
            return generateMockQuiz();
        }

        if (quizQuestions.isEmpty()) {
            return generateMockQuiz();
        }
        return quizQuestions;
    }

    private String generateMockSummary(String title) {
        return "# Summary: " + title + " (Demo Mode)\n\n" +
                "*Note: Groq API Key was not provided. This is a simulated preview summary of the document.*\n\n" +
                "### 📘 Overview of the Document\n" +
                "This document, titled **" + title + "**, has been successfully processed by StudyMate. The text content was extracted using Apache PDFBox and cached in the application's local repository.\n\n" +
                "### 🔑 Key Takeaways & Core Concepts\n" +
                "- **Primary Topic**: The document discusses themes related to educational material, technical references, or study notes.\n" +
                "- **Infrastructure Setup**: The project is structured with a modern Spring Boot backend using JPA to interact with an in-memory database, and a React frontend which provides an interactive study experience.\n" +
                "- **File Management**: Document storage is offloaded to Cloudinary, ensuring that assets are managed via a dedicated CDN and accessible securely.\n" +
                "- **AI Pipeline**: The text ingestion system strips formatting, collapses whitespace, truncates the stream to a safe 50,000 character limit, and submits it to Groq's high-speed inference engine.\n\n" +
                "### 💡 Recommended Next Steps\n" +
                "1. Proceed to the **Quiz** tab to test your understanding of the concepts.\n" +
                "2. Try uploading other PDFs to see the system process multiple files concurrently.\n" +
                "3. Set your custom `GROQ_API_KEY` in `backend/src/main/resources/application.properties` to switch from Demo Mode to live AI completions.";
    }

    private List<QuizQuestion> generateMockQuiz() {
        List<QuizQuestion> questions = new ArrayList<>();

        questions.add(QuizQuestion.builder()
                .questionText("Which tool is used by StudyMate's backend to extract text from PDF files?")
                .options(List.of("Apache POI", "Jackson JSON Parser", "Apache PDFBox", "Spring WebClient"))
                .correctOptionIndex(2)
                .explanation("Apache PDFBox is an open-source Java library that provides utility classes for parsing, rendering, and generating PDF documents. POI is for Office documents, Jackson is for JSON, and WebClient is for HTTP requests.")
                .build());

        questions.add(QuizQuestion.builder()
                .questionText("Where are the uploaded PDF files stored in StudyMate?")
                .options(List.of("Cloudinary CDN", "Local file system folder", "In-memory database (H2)", "Google Drive"))
                .correctOptionIndex(0)
                .explanation("Uploaded PDFs are sent to Cloudinary, a cloud-based image and video management service that stores the raw files and serves them via CDN.")
                .build());

        questions.add(QuizQuestion.builder()
                .questionText("What model does GroqService use by default for AI generation?")
                .options(List.of("gpt-4-turbo", "llama-3.1-8b-instant", "claude-3-opus", "gemini-1.5-pro"))
                .correctOptionIndex(1)
                .explanation("By default, the application is configured to call Groq's llama-3.1-8b-instant model, which provides high-speed, free completions.")
                .build());

        questions.add(QuizQuestion.builder()
                .questionText("Which database is used by default in this project for local development metadata storage?")
                .options(List.of("PostgreSQL", "MongoDB", "MySQL", "H2 In-Memory Database"))
                .correctOptionIndex(3)
                .explanation("H2 is an in-memory SQL database that requires no external setup and is perfect for rapid local prototyping of metadata and quiz caches.")
                .build());

        questions.add(QuizQuestion.builder()
                .questionText("What frontend library/framework is used for StudyMate's user interface?")
                .options(List.of("Angular", "Vue", "React with Vite", "Svelte"))
                .correctOptionIndex(2)
                .explanation("The frontend directory is initialized as a React application using Vite for lightning-fast hot module replacement (HMR) and custom Vanilla CSS styling.")
                .build());

        return questions;
    }
}
