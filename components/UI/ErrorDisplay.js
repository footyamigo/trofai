export default function ErrorDisplay({ message, details, onDismiss }) {
  // Extract specific error types to provide more helpful messages
  const isAddressError = message?.includes('address') || details?.includes('address');

  return (
    <div className="error-container">
      <div className="error-content">
        <h3>Error</h3>
        <p className="error-message">{message}</p>
        
        {isAddressError && (
          <div className="error-hint">
            <strong>Hint:</strong> The Rightmove property data could not be properly accessed. 
            This could be due to:
            <ul>
              <li>The URL format is incorrect</li>
              <li>The property listing no longer exists</li>
              <li>The Rightmove page structure has changed</li>
            </ul>
            <p>Try a different Rightmove property URL.</p>
          </div>
        )}
        
        {details && (
          <div className="details-container">
            <details>
              <summary>Technical Details</summary>
              <pre className="error-details">{details}</pre>
            </details>
          </div>
        )}
        
        {onDismiss && (
          <button className="dismiss-button" onClick={onDismiss}>
            Dismiss
          </button>
        )}
      </div>

      <style jsx>{`
        .error-container {
          background-color: #fff0f0;
          border: 1px solid #ffcccc;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1.5rem;
          width: 100%;
        }
        
        .error-content {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        h3 {
          color: #d32f2f;
          margin: 0;
          font-size: 1.1rem;
        }
        
        .error-message {
          margin: 0;
          color: #333;
          font-weight: 500;
        }
        
        .error-hint {
          margin-top: 0.5rem;
          padding: 0.75rem;
          background-color: #fffee6;
          border-left: 3px solid #e6dc00;
          font-size: 0.9rem;
        }
        
        .error-hint ul {
          margin: 0.5rem 0 0.5rem 1.5rem;
          padding: 0;
        }
        
        .details-container {
          margin-top: 0.5rem;
        }
        
        .error-details {
          background: #333;
          color: #f0f0f0;
          padding: 0.75rem;
          border-radius: 4px;
          font-size: 0.8rem;
          overflow-x: auto;
          white-space: pre-wrap;
          word-break: break-word;
        }
        
        .dismiss-button {
          align-self: flex-end;
          background-color: #f44336;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 0.5rem 1rem;
          cursor: pointer;
          font-size: 0.9rem;
          margin-top: 0.5rem;
        }
        
        .dismiss-button:hover {
          background-color: #d32f2f;
        }
      `}</style>
    </div>
  );
} 