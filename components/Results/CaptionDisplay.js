import { useState } from 'react';

export default function CaptionDisplay({ caption }) {
  const [copySuccess, setCopySuccess] = useState('');
  
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess('Copied!');
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      setCopySuccess('Failed to copy!');
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="caption-container">
      <h3>Instagram Caption</h3>
      <textarea 
        value={caption} 
        readOnly 
        className="caption"
      />
      <button 
        className="copy-button"
        onClick={() => copyToClipboard(caption)}
      >
        {copySuccess || 'Copy Caption'}
      </button>

      <style jsx>{`
        .caption-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          width: 100%;
        }
        
        h3 {
          margin: 0;
        }
        
        .caption {
          width: 100%;
          min-height: 200px;
          padding: 1rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-family: inherit;
          resize: vertical;
        }
        
        .copy-button {
          padding: 0.8rem 1.5rem;
          background: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
          width: 100%;
          max-width: 200px;
          align-self: center;
        }
      `}</style>
    </div>
  );
} 