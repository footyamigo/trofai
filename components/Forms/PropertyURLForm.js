import { useState } from 'react';
import ErrorDisplay from '../UI/ErrorDisplay';

export default function PropertyURLForm({ onSubmit, buttonText = 'Trof it!' }) {
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState({ message: '', details: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setError({ message: '', details: '' });
    
    try {
      // Validate URL
      if (!url) {
        throw new Error('Please enter a Rightmove property URL');
      }
      
      if (!url.includes('rightmove.co.uk/properties/')) {
        throw new Error('Please enter a valid Rightmove property URL');
      }
      
      await onSubmit(url);
    } catch (err) {
      console.error('Form submission error:', err);
      setError({ 
        message: err.message || 'An error occurred processing this URL',
        details: err.stack || ''
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit} className="form">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter Rightmove property URL"
          className="input"
          required
        />
        <button 
          type="submit" 
          className="button"
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : buttonText}
        </button>
      </form>
      
      {error.message && (
        <ErrorDisplay 
          message={error.message} 
          details={error.details}
          onDismiss={() => setError({ message: '', details: '' })} 
        />
      )}

      <style jsx>{`
        .form-container {
          width: 100%;
        }
        
        .form {
          display: flex;
          margin-bottom: 1rem;
        }
        
        .input {
          flex: 1;
          padding: 0.8rem;
          font-size: 1rem;
          border: 1px solid #ddd;
          border-radius: 4px 0 0 4px;
        }
        
        .button {
          padding: 0.8rem 1.5rem;
          background: #0070f3;
          color: white;
          border: none;
          border-radius: 0 4px 4px 0;
          cursor: pointer;
          font-weight: bold;
        }
        
        .button:disabled {
          background: #999;
        }
        
        @media (max-width: 600px) {
          .form {
            flex-direction: column;
          }
          
          .input {
            border-radius: 4px;
            margin-bottom: 1rem;
          }
          
          .button {
            border-radius: 4px;
          }
        }
      `}</style>
    </div>
  );
} 