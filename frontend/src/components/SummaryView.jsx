import React from 'react';
import { ExternalLink, FileText } from 'lucide-react';

export default function SummaryView({ document }) {
  // A lightweight custom markdown parser to convert standard markdown characters into styled React/HTML elements
  const renderMarkdown = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    const elements = [];
    let currentList = [];
    let inList = false;

    const flushList = (key) => {
      if (inList && currentList.length > 0) {
        elements.push(
          <ul key={`list-${key}`} className="summary-list">
            {currentList.map((item, index) => (
              <li key={index} dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(item) }} />
            ))}
          </ul>
        );
        currentList = [];
        inList = false;
      }
    };

    const parseInlineMarkdown = (rawText) => {
      return rawText
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // bold
        .replace(/\*(.*?)\*/g, '<em>$1</em>')          // italics
        .replace(/`(.*?)`/g, '<code>$1</code>');        // inline code
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('# ')) {
        flushList(index);
        elements.push(
          <h1 key={index} dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(trimmed.slice(2)) }} />
        );
      } else if (trimmed.startsWith('## ')) {
        flushList(index);
        elements.push(
          <h2 key={index} dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(trimmed.slice(3)) }} />
        );
      } else if (trimmed.startsWith('### ')) {
        flushList(index);
        elements.push(
          <h3 key={index} dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(trimmed.slice(4)) }} />
        );
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        inList = true;
        currentList.push(trimmed.slice(2));
      } else if (trimmed.startsWith('> ')) {
        flushList(index);
        elements.push(
          <blockquote key={index} dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(trimmed.slice(2)) }} />
        );
      } else if (trimmed === '') {
        flushList(index);
      } else {
        flushList(index);
        elements.push(
          <p key={index} style={{ marginBottom: '1rem' }} dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(trimmed) }} />
        );
      }
    });

    flushList('final');
    return elements;
  };

  return (
    <div className="glass-card">
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          borderBottom: '1px solid var(--glass-border)',
          paddingBottom: '1rem',
          marginBottom: '1.5rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(var(--primary-hsl))', fontWeight: 600 }}>
          <FileText size={20} />
          <span>Study Notes & Key Takeaways</span>
        </div>
        {document.cloudinaryUrl && (
          <a
            href={document.cloudinaryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <span>Original PDF</span>
            <ExternalLink size={12} />
          </a>
        )}
      </div>

      <div className="summary-content">
        {renderMarkdown(document.summary)}
      </div>
    </div>
  );
}
