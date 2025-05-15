import React from 'react';

const Button = ({ 
  children, 
  onClick, 
  type = 'button', 
  disabled = false, 
  className = '',
  isLoading = false,
  fullWidth = false,
}) => {
  return (
    <>
      <button
        type={type}
        onClick={onClick}
        disabled={disabled || isLoading}
        className={`base-button ${fullWidth ? 'full-width' : ''} ${className}`}
      >
        {isLoading ? (
          <span className="loading-spinner"></span>
        ) : children}
      </button>

      <style jsx>{`
        .base-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.6rem 1.2rem;
          background: #62d76b;
          color: black;
          border: 2px solid black;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.8);
        }

        .base-button:hover {
          background: #56c15f;
          box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.8);
          transform: translateY(-1px);
        }

        .base-button:disabled {
          background: #e2e8f0;
          color: #a0aec0;
          border-color: #a0aec0;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .full-width {
          width: 100%;
        }
        
        .small {
          padding: 0.4rem 0.8rem;
          font-size: 0.75rem;
          box-shadow: 1px 1px 0 rgba(0, 0, 0, 0.8);
        }
        
        .small:hover {
          box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.8);
        }
        
        .outline {
          background: transparent;
          border: 1px solid #62d76b;
          color: #62d76b;
          box-shadow: none;
        }
        
        .outline:hover {
          background: rgba(98, 215, 107, 0.1);
          box-shadow: none;
          transform: none;
        }

        .loading-spinner {
          display: inline-block;
          width: 1rem;
          height: 1rem;
          border: 2px solid rgba(26, 26, 26, 0.3);
          border-radius: 50%;
          border-top-color: #1a1a1a;
          animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default Button; 