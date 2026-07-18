package com.studymate.backend;

import com.studymate.backend.entity.QuizQuestion;
import com.studymate.backend.service.GroqService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class BackendApplicationTests {

	@Autowired
	private GroqService groqService;

	@Test
	void contextLoads() {
		assertNotNull(groqService);
	}

	@Test
	void testGenerateQuizWithSummary() {
		String title = "Java Basics";
		String summaryContent = "# Java Programming\n" +
				"Java is a high-level, class-based, object-oriented programming language.\n" +
				"It was developed by James Gosling at Sun Microsystems and released in 1995.\n" +
				"Key features include Platform Independence (Compile once, run anywhere using JVM), Garbage Collection, and Strong Type Safety.";

		List<QuizQuestion> questions = groqService.generateQuiz(title, summaryContent);
		
		assertNotNull(questions);
		assertFalse(questions.isEmpty());
		
		// Check that the returned questions are not mock questions.
		// The mock questions in generateMockQuiz start with specific prompts or are not related to Java basics:
		// e.g. "Which tool is used by StudyMate's backend to extract text..."
		for (QuizQuestion q : questions) {
			System.out.println("Q: " + q.getQuestionText());
			System.out.println("Options: " + q.getOptions());
			System.out.println("Correct Option Index: " + q.getCorrectOptionIndex());
			System.out.println("Explanation: " + q.getExplanation());
			System.out.println("---");
			
			// Assert that questions do not mention "StudyMate" (as the mock questions do)
			assertFalse(q.getQuestionText().contains("StudyMate"), "Generated questions should not contains StudyMate mock text");
		}
	}
}
