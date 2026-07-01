import React from 'react';
import { BookOpen, Trash2 } from 'lucide-react';

export default function DocumentList({ documents, selectedDocumentId, onSelectDocument, onDeleteDocument }) {
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  if (!documents || documents.length === 0) {
    return (
      <div className="sidebar" style={{ justifyContent: 'center', alignItems: 'center', opacity: 0.6 }}>
        <BookOpen size={36} style={{ strokeWidth: 1.5, marginBottom: '0.5rem', color: 'hsl(var(--text-muted))' }} />
        <p style={{ fontSize: '0.85rem', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
          No study documents uploaded yet.
        </p>
      </div>
    );
  }

  return (
    <div className="sidebar">
      <h3>Study History ({documents.length})</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {documents.map((doc) => (
          <div
            key={doc.id}
            className={`document-item ${selectedDocumentId === doc.id ? 'active' : ''}`}
            onClick={() => onSelectDocument(doc)}
          >
            <BookOpen size={18} style={{ flexShrink: 0 }} />
            <div className="doc-info">
              <div className="doc-title" title={doc.title}>
                {doc.title}
              </div>
              <div className="doc-date">{formatDate(doc.createdAt)}</div>
            </div>
            <button
              className="btn-delete-doc"
              onClick={(e) => {
                e.stopPropagation(); // Avoid selecting when clicking delete
                onDeleteDocument(doc.id);
              }}
              title="Delete document"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
