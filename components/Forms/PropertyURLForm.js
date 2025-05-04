import { useState } from 'react';
import ErrorDisplay from '../UI/ErrorDisplay';
import Button from '../UI/Button';

export default function PropertyURLForm({ onSubmit, buttonText = 'Trof it!', placeholder = "Paste a Rightmove, Zillow, OnTheMarket, or Realtor.com property URL" }) {
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState({ message: '', details: '', code: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setError({ message: '', details: '', code: '' });
    
    try {
      // Validate URL
      if (!url) {
        throw new Error('Please enter a property URL');
      }
      
      // Check for supported property sites
      const isRightmove = url.includes('rightmove.co.uk/properties/');
      const isZillow = url.includes('zillow.com/');
      const isOnTheMarket = url.includes('onthemarket.com/details/');
      const isRealtor = url.includes('realtor.com/realestateandhomes-detail/') || url.includes('realtor.com/rentals/details/');
      
      if (!isRightmove && !isZillow && !isOnTheMarket && !isRealtor) {
        throw new Error('Please enter a valid Rightmove, Zillow, OnTheMarket, or Realtor.com property URL');
      }
      
      await onSubmit(url);
    } catch (err) {
      console.error('Form submission error:', err);
      setError({ 
        message: err.message || 'An error occurred processing this URL',
        details: err.stack || '',
        code: err.code || ''
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit} className="form">
        <div className="input-group">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={placeholder}
            className="input"
            required
          />
          <Button 
            type="submit" 
            variant="success"
            size="large"
            disabled={isProcessing}
            className="form-button"
          >
            {isProcessing ? 'Processing...' : buttonText}
          </Button>
        </div>
      </form>
      
      {error.message && (
        <ErrorDisplay 
          message={error.message} 
          details={error.details}
          code={error.code}
          onDismiss={() => setError({ message: '', details: '', code: '' })} 
        />
      )}

      <style jsx>{`
        .form-container {
          width: 100%;
        }
        
        .form {
          width: 100%;
          margin-bottom: 1rem;
        }
        
        .input-group {
          display: flex;
          align-items: stretch;
          width: 100%;
          border: 2px solid black;
          border-radius: 8px;
          overflow: hidden;
          background: white;
        }
        
        .input {
          flex: 1;
          padding: 1rem 1.5rem;
          font-size: 1.1rem;
          border: none;
          outline: none;
          min-width: 0;
        }
        
        .form-button {
          white-space: nowrap;
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          border: none;
          border-left: 2px solid black;
          border-radius: 0;
          margin: 0;
          height: auto;
        }
        
        @media (max-width: 600px) {
          .input-group {
            flex-direction: column;
          }
          
          .input {
            width: 100%;
            border-bottom: 2px solid black;
          }
          
          .form-button {
            width: 100%;
            border-left: none;
          }
        }
      `}</style>
    </div>
  );
} 