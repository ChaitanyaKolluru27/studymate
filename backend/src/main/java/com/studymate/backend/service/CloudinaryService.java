package com.studymate.backend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
public class CloudinaryService {

    @Value("${cloudinary.cloud-name:${CLOUDINARY_CLOUD_NAME:}}")
    private String cloudName;

    @Value("${cloudinary.api-key:${CLOUDINARY_API_KEY:}}")
    private String apiKey;

    @Value("${cloudinary.api-secret:${CLOUDINARY_API_SECRET:}}")
    private String apiSecret;

    private Cloudinary cloudinary;
    private boolean useFallback = false;

    @PostConstruct
    public void init() {
        if (isConfigured()) {
            this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                    "cloud_name", cloudName,
                    "api_key", apiKey,
                    "api_secret", apiSecret
            ));
            log.info("Cloudinary service initialized successfully.");
        } else {
            useFallback = true;
            log.warn("========================================================================");
            log.warn("CLOUDINARY IS NOT CONFIGRURED. Falling back to local simulated uploads.");
            log.warn("Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET");
            log.warn("in application.properties to enable actual Cloudinary storage.");
            log.warn("========================================================================");
        }
    }

    private boolean isConfigured() {
        return cloudName != null && !cloudName.trim().isEmpty() && !cloudName.contains("YOUR_CLOUD_NAME")
                && apiKey != null && !apiKey.trim().isEmpty() && !apiKey.contains("YOUR_API_KEY")
                && apiSecret != null && !apiSecret.trim().isEmpty() && !apiSecret.contains("YOUR_API_SECRET");
    }

    public String uploadPdf(MultipartFile file) throws IOException {
        if (useFallback) {
            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            log.info("[FALLBACK] Simulating PDF upload for: {} -> {}", file.getOriginalFilename(), fileName);
            
            // To ensure local testing works, we can return a mock URL.
            // Under normal circumstances, this is a placeholder.
            return "https://res.cloudinary.com/mock-cloud/image/upload/v1700000000/mock_folder/" + fileName;
        }

        log.info("Uploading PDF to Cloudinary: {}", file.getOriginalFilename());
        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                "resource_type", "raw",
                "folder", "studymate_pdfs"
        ));
        
        String secureUrl = (String) uploadResult.get("secure_url");
        log.info("Cloudinary upload successful. URL: {}", secureUrl);
        return secureUrl;
    }
}
