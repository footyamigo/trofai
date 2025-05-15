import React from 'react';

export default function ConfirmationModal({ isOpen, onCancel, onConfirm, title, message, isLoading }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h3 className="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button className="cancel-button" onClick={onCancel} disabled={isLoading}>
            Cancel
          </button>
          <button 
            className={`confirm-button ${isLoading ? 'loading' : ''}`} 
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Processing...
              </>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-container {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          padding: 1.5rem;
          width: 400px;
          max-width: 90%;
          animation: slideIn 0.2s ease-out;
        }

        @keyframes slideIn {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .modal-title {
          margin: 0 0 1rem 0;
          font-size: 1.25rem;
          color: #1a1a1a;
        }

        .modal-message {
          margin: 0 0 1.5rem 0;
          color: #4a5568;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
        }

        .cancel-button {
          padding: 0.5rem 1rem;
          background: transparent;
          color: #4a5568;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .cancel-button:hover:not(:disabled) {
          background: #f7fafc;
        }
        
        .cancel-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .confirm-button {
          padding: 0.5rem 1rem;
          background: #e53e3e;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .confirm-button:hover:not(:disabled) {
          background: #c53030;
        }
        
        .confirm-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .confirm-button.loading {
          background: #fc8181;
        }
        
        .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.5);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
} 