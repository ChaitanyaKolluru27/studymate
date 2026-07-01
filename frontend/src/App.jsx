import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, Clock, ArrowLeft, BookOpen, GraduationCap } from 'lucide-react';
import DocumentUpload from './components/DocumentUpload';
import DocumentList from './components/DocumentList';
import SummaryView from './components/SummaryView';
import QuizView from './components/QuizView';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085/api/documents';

function App() {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [activeTab, setActiveTab] = useState('summary'); // summary | quiz
  const [loading, setLoading] = useState(true);
  const [quizGenerating, setQuizGenerating] = useState(false);

  // Fetch document history on initial load
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_BASE_URL);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      } else {
        console.error('Failed to load study history.');
      }
    } catch (err) {
      console.error('API connection error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuiz = async (docId) => {
    try {
      setQuizGenerating(true);
      const response = await fetch(`${API_BASE_URL}/${docId}/generate-quiz`, {
        method: 'POST'
      });
      if (response.ok) {
        const questions = await response.json();
        // Update document inside selectedDoc state
        setSelectedDoc(prev => ({ ...prev, questions }));
        // Update document inside documents array history
        setDocuments(prev => prev.map(doc => {
          if (doc.id === docId) {
            return { ...doc, questions };
          }
          return doc;
        }));
      } else {
        alert('Failed to generate practice quiz questions. Please check server logs.');
      }
    } catch (err) {
      console.error('Error generating quiz:', err);
      alert('A network error occurred while generating the quiz.');
    } finally {
      setQuizGenerating(false);
    }
  };

  const handleSelectDocument = (doc) => {
    setSelectedDoc(doc);
    setActiveTab('summary'); // Reset back to summary notes when loading a new file
  };

  const handleDeleteDocument = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document and its quiz from your history?')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setDocuments(prev => prev.filter(doc => doc.id !== id));
        if (selectedDoc && selectedDoc.id === id) {
          setSelectedDoc(null);
        }
      } else {
        alert('Failed to delete document.');
      }
    } catch (err) {
      console.error('Error deleting document:', err);
    }
  };

  const handleUploadSuccess = (newDoc) => {
    setDocuments(prev => [newDoc, ...prev]);
    setSelectedDoc(newDoc);
    setActiveTab('summary');
  };

  const handleCloseSession = () => {
    setSelectedDoc(null);
  };

  return (
    <>
      {/* Top sticky navbar */}
      <header className="navbar">
        <div className="logo-container" onClick={handleCloseSession} style={{ cursor: 'pointer' }}>
          <GraduationCap size={32} className="logo-icon" />
          <span>StudyMate</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Sparkles size={14} style={{ color: 'hsl(var(--primary-hsl))' }} />
            Powered by Groq LLM
          </span>
        </div>
      </header>

      {/* Main layouts: Sidebar and Study Panel */}
      <main className="dashboard-container">
        {/* Sidebar displaying past study materials */}
        {loading ? (
          <div className="sidebar" style={{ justifyContent: 'center', alignItems: 'center', opacity: 0.6 }}>
            <div className="spinner" style={{ width: '30px', height: '30px' }}></div>
            <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', marginTop: '0.5rem' }}>Loading study history...</p>
          </div>
        ) : (
          <DocumentList
            documents={documents}
            selectedDocumentId={selectedDoc?.id}
            onSelectDocument={handleSelectDocument}
            onDeleteDocument={handleDeleteDocument}
          />
        )}

        {/* Dynamic Study Panel */}
        <section className="main-content">
          {selectedDoc ? (
            // A study session is active (PDF details are displayed)
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Session Control Bar */}
              <div className="study-header">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxWidth: '65%' }}>
                  <button 
                    onClick={handleCloseSession} 
                    className="btn btn-secondary"
                    style={{ alignSelf: 'flex-start', padding: '0.4rem 0.8rem', fontSize: '0.8rem', marginBottom: '0.5rem' }}
                  >
                    <ArrowLeft size={14} />
                    <span>Back to Dashboard</span>
                  </button>
                  <h2 className="study-title" title={selectedDoc.title}>{selectedDoc.title}</h2>
                </div>

                {/* Tab selector */}
                <div className="tab-group">
                  <button
                    className={`tab-button ${activeTab === 'summary' ? 'active' : ''}`}
                    onClick={() => setActiveTab('summary')}
                  >
                    <BookOpen size={16} />
                    <span>Summary</span>
                  </button>
                  <button
                    className={`tab-button ${activeTab === 'quiz' ? 'active' : ''}`}
                    onClick={() => setActiveTab('quiz')}
                  >
                    <Brain size={16} />
                    <span>Practice Quiz</span>
                  </button>
                </div>
              </div>

              {/* Selected view: summary notes or quiz game */}
              {activeTab === 'summary' ? (
                <SummaryView document={selectedDoc} />
              ) : quizGenerating ? (
                <div className="glass-card processing-container">
                  <div className="spinner"></div>
                  <div className="processing-step">Groq AI is analyzing content to generate 5 practice questions...</div>
                  <p className="upload-subtitle" style={{ maxWidth: '300px' }}>
                    This requires a few seconds as the model reviews terms and compiles answers and explanations.
                  </p>
                </div>
              ) : !selectedDoc.questions || selectedDoc.questions.length === 0 ? (
                <div className="glass-card text-center" style={{ padding: '3.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
                  <Brain size={48} style={{ color: 'hsl(var(--primary-hsl))' }} />
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Ready to Test Your Retention?</h2>
                  <p style={{ color: 'hsl(var(--text-secondary))', maxWidth: '460px', lineHeight: 1.5, fontSize: '0.95rem' }}>
                    Generate a custom active-recall quiz based on this document. Groq AI will draft 5 multiple-choice questions complete with correct answers and detailed explanatory notes.
                  </p>
                  <button className="btn btn-primary" onClick={() => handleGenerateQuiz(selectedDoc.id)} style={{ marginTop: '0.5rem' }}>
                    <Sparkles size={16} />
                    <span>Generate AI Quiz</span>
                  </button>
                </div>
              ) : (
                <QuizView questions={selectedDoc.questions} docTitle={selectedDoc.title} />
              )}
            </div>
          ) : (
            // Home state: no study session is loaded, prompt user to upload a PDF file
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ textAlign: 'left' }}>
                <h1 style={{ marginTop: '0.5rem', marginBottom: '0.5rem', fontWeight: 800 }}>Master Any Material</h1>
                <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '1.05rem', maxWidth: '600px', lineHeight: 1.5 }}>
                  Upload your study guides, lecture slides, or textbook chapters as PDFs. StudyMate will automatically extract the core details, provide clean summaries, and compile instant quiz questions.
                </p>
              </div>

              <DocumentUpload onUploadSuccess={handleUploadSuccess} />

              {documents.length === 0 && (
                <div className="empty-state">
                  <BookOpen size={48} className="empty-state-icon" />
                  <h2>Your Study Vault is Empty</h2>
                  <p>
                    Drag a PDF file above to launch your first AI-assisted study session!
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} StudyMate. Enhancing retention through active recall.</p>
      </footer>
    </>
  );
}

export default App;
