export default function ErrorDisplay({ message, onDismiss }) {
  return (
    <div className="error-container">
      <div className="error-content">
        <h3>Error</h3>
        <p>{message}</p>
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
        
        p {
          margin: 0;
          color: #333;
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
        }
        
        .dismiss-button:hover {
          background-color: #d32f2f;
        }
      `}</style>
    </div>
  );
} 