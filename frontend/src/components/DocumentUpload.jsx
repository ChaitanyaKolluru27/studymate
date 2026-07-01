import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, RefreshCw } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085/api/documents';

export default function DocumentUpload({ onUploadSuccess }) {
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | processing | error
  const [step, setStep] = useState(''); // uploading | parsing | AI summarization | AI quiz
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const processFile = async (file) => {
    // Validate file type
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setStatus('error');
      setErrorMsg('Invalid file format. Please upload a PDF document.');
      return;
    }

    // Limit to 10MB
    if (file.size > 10 * 1024 * 1024) {
      setStatus('error');
      setErrorMsg('File is too large. Maximum size allowed is 10MB.');
      return;
    }

    setStatus('processing');
    setStep('Uploading PDF file...');

    // Progress Simulation Steps
    const progressTimer1 = setTimeout(() => setStep('Extracting PDF text content...'), 2000);
    const progressTimer2 = setTimeout(() => setStep('Analyzing text and summarizing with Groq...'), 5000);
    const progressTimer3 = setTimeout(() => setStep('Generating interactive quiz questions...'), 9000);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      // Clear the fake timers
      clearTimeout(progressTimer1);
      clearTimeout(progressTimer2);
      clearTimeout(progressTimer3);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Server failed to process PDF.');
      }

      const savedDocument = await response.json();
      setStatus('idle');
      onUploadSuccess(savedDocument);
    } catch (err) {
      clearTimeout(progressTimer1);
      clearTimeout(progressTimer2);
      clearTimeout(progressTimer3);
      
      console.error(err);
      setStatus('error');
      setErrorMsg(err.message || 'An error occurred while uploading and parsing the document.');
    }
  };

  if (status === 'processing') {
    return (
      <div className="glass-card processing-container">
        <div className="spinner"></div>
        <div className="processing-step">{step}</div>
        <p className="upload-subtitle" style={{ maxWidth: '300px' }}>
          This can take a few seconds depending on document length and API response times.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card">
      <div
        className={`upload-zone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf"
          style={{ display: 'none' }}
        />
        
        <div className="upload-icon-container">
          <Upload size={32} />
        </div>
        
        <div className="upload-title">
          Drag & drop your study PDF here
        </div>
        <p className="upload-subtitle">
          or click to browse your local files (supports up to 10MB)
        </p>
      </div>

      {status === 'error' && (
        <div 
          className="glass-card" 
          style={{ 
            marginTop: '1.25rem', 
            background: 'var(--error-bg)', 
            borderColor: 'var(--error-border)',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: 'hsl(var(--error-hsl))',
            borderRadius: '12px'
          }}
        >
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.9rem', textAlign: 'left', flex: 1 }}>{errorMsg}</div>
          <button 
            className="btn btn-secondary" 
            onClick={() => setStatus('idle')}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: 'inherit', borderColor: 'rgba(239, 68, 68, 0.2)' }}
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
}
