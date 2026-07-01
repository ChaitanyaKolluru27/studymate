import React, { useState } from 'react';
import { Award, CheckCircle2, AlertTriangle, ArrowRight, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function QuizView({ questions, docTitle }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState(null); // option selected by user
  const [score, setScore] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  if (!questions || questions.length === 0) {
    return (
      <div className="glass-card text-center" style={{ padding: '3rem' }}>
        <AlertTriangle size={36} style={{ color: 'hsl(var(--error-hsl))', marginBottom: '1rem' }} />
        <h3>No Quiz Questions Available</h3>
        <p style={{ color: 'hsl(var(--text-muted))', marginTop: '0.5rem' }}>
          We couldn't load any questions for this document. Try re-uploading or check the console logs.
        </p>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];
  const totalQuestions = questions.length;
  const progressPercent = ((currentIdx) / totalQuestions) * 100;

  const handleOptionClick = (optionIndex) => {
    if (isSubmitted) return; // Prevent clicking after selection
    setSelectedIdx(optionIndex);
  };

  const handleSubmit = () => {
    if (selectedIdx === null || isSubmitted) return;

    const isCorrect = selectedIdx === currentQuestion.correctOptionIndex;
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    
    setIsSubmitted(true);
  };

  const handleNext = () => {
    if (currentIdx + 1 < totalQuestions) {
      setCurrentIdx(prev => prev + 1);
      setSelectedIdx(null);
      setIsSubmitted(false);
    } else {
      setIsFinished(true);
      // Trigger confetti for high scores!
      const finalScore = score + (selectedIdx === currentQuestion.correctOptionIndex ? 1 : 0);
      const scoreRatio = finalScore / totalQuestions;
      if (scoreRatio >= 0.8) {
        triggerConfetti();
      }
    }
  };

  const triggerConfetti = () => {
    // Left side burst
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 }
    });
    // Right side burst
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 }
    });
  };

  const handleRetake = () => {
    setCurrentIdx(0);
    setSelectedIdx(null);
    setScore(0);
    setIsSubmitted(false);
    setIsFinished(false);
  };

  // Option styling helper
  const getOptionClass = (index) => {
    if (!isSubmitted) {
      return selectedIdx === index ? 'option-card selected' : 'option-card';
    }
    
    // After submission:
    if (index === currentQuestion.correctOptionIndex) {
      return 'option-card correct'; // correct answer
    }
    if (selectedIdx === index && index !== currentQuestion.correctOptionIndex) {
      return 'option-card incorrect'; // incorrect answer clicked by user
    }
    return 'option-card unselected'; // other options
  };

  const getScoreComment = (ratio) => {
    if (ratio === 1) return 'Perfect Score! 🏆';
    if (ratio >= 0.8) return 'Outstanding! 🌟';
    if (ratio >= 0.6) return 'Good Job! 👍';
    return 'Keep Studying! 📚';
  };

  const getScoreDescription = (ratio) => {
    if (ratio === 1) return 'Incredible! You have fully mastered the concepts covered in this study guide.';
    if (ratio >= 0.8) return 'Excellent work! You have a solid grasp on this material.';
    if (ratio >= 0.6) return 'Nice effort! Reviewing the summary once more could help secure a perfect score.';
    return 'StudyMate suggests rereading the summary and key terms before retaking this quiz.';
  };

  if (isFinished) {
    const finalRatio = score / totalQuestions;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="glass-card score-screen">
          <div className="score-circle">
            <span className="score-number">{score}</span>
            <span className="score-total">out of {totalQuestions}</span>
          </div>
          
          <div className="score-comment">{getScoreComment(finalRatio)}</div>
          <p className="score-description">{getScoreDescription(finalRatio)}</p>
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button className="btn btn-primary" onClick={handleRetake}>
              <RotateCcw size={16} />
              <span>Retake Quiz</span>
            </button>
          </div>
        </div>

        {/* Detailed Explanation Review */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem', textAlign: 'left' }}>
            Review Explanations & Answers
          </h3>
          {questions.map((q, idx) => (
            <div key={idx} style={{ textAlign: 'left', paddingBottom: '1.25rem', borderBottom: idx < questions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <div style={{ fontWeight: 600, color: 'hsl(var(--text-primary))', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                {idx + 1}. {q.questionText}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'hsl(var(--success-hsl))', background: 'var(--success-bg)', padding: '0.4rem 0.75rem', borderRadius: '8px', width: 'fit-content', marginBottom: '0.5rem', border: '1px solid var(--success-border)' }}>
                <strong>Correct Option:</strong> {q.options[q.correctOptionIndex]}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))', lineHeight: 1.5, background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                <strong>Explanation:</strong> {q.explanation}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card quiz-container">
      {/* Header & Progress */}
      <div>
        <div className="quiz-progress">
          <span>Question {currentIdx + 1} of {totalQuestions}</span>
          <span>Score: {score}</span>
        </div>
        <div className="progress-bar-bg">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${progressPercent}%`, transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
          ></div>
        </div>
      </div>

      {/* Question */}
      <div className="question-text">
        {currentQuestion.questionText}
      </div>

      {/* Options */}
      <div className="options-grid">
        {currentQuestion.options.map((option, idx) => (
          <button
            key={idx}
            className={getOptionClass(idx)}
            onClick={() => handleOptionClick(idx)}
            disabled={isSubmitted}
            style={
              !isSubmitted && selectedIdx === idx 
                ? { borderColor: 'hsl(var(--primary-hsl))', background: 'var(--primary-glow)', transform: 'translateX(4px)' } 
                : {}
            }
          >
            <div className="option-badge">
              {String.fromCharCode(65 + idx)}
            </div>
            <div style={{ flex: 1 }}>{option}</div>
          </button>
        ))}
      </div>

      {/* Explanation Box shown immediately after submit */}
      {isSubmitted && currentQuestion.explanation && (
        <div 
          style={{ 
            marginTop: '1.25rem', 
            padding: '1.25rem', 
            background: 'rgba(255, 255, 255, 0.03)', 
            borderLeft: '4px solid hsl(var(--primary-hsl))',
            borderRadius: '0 12px 12px 0',
            textAlign: 'left',
            animation: 'pulse 1s 1'
          }}
        >
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'hsl(var(--text-primary))', marginBottom: '0.25rem' }}>
            Why is this correct?
          </div>
          <p style={{ fontSize: '0.9rem', color: 'hsl(var(--text-secondary))', lineHeight: 1.5 }}>
            {currentQuestion.explanation}
          </p>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
        {!isSubmitted ? (
          <button 
            className="btn btn-primary" 
            onClick={handleSubmit} 
            disabled={selectedIdx === null}
            style={{ opacity: selectedIdx === null ? 0.6 : 1 }}
          >
            <span>Submit Answer</span>
            <CheckCircle2 size={16} />
          </button>
        ) : (
          <button className="btn btn-primary" onClick={handleNext}>
            <span>{currentIdx + 1 === totalQuestions ? 'Finish Quiz' : 'Next Question'}</span>
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
