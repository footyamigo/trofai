export default function Button({ 
  children, 
  onClick, 
  disabled = false, 
  type = 'button',
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  className = ''
}) {
  return (
    <button 
      type={type} 
      className={`button ${variant} ${size} ${fullWidth ? 'full-width' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}

      <style jsx>{`
        .button {
          font-weight: bold;
          cursor: pointer;
          border: none;
          border-radius: 4px;
          transition: background-color 0.2s;
        }
        
        .button:disabled {
          cursor: not-allowed;
          opacity: 0.7;
        }
        
        .primary {
          background-color: #0070f3;
          color: white;
        }
        
        .primary:hover:not(:disabled) {
          background-color: #0060df;
        }
        
        .secondary {
          background-color: #f5f5f5;
          color: #333;
          border: 1px solid #ddd;
        }
        
        .secondary:hover:not(:disabled) {
          background-color: #e5e5e5;
        }
        
        .small {
          padding: 0.4rem 0.8rem;
          font-size: 0.8rem;
        }
        
        .medium {
          padding: 0.8rem 1.5rem;
          font-size: 1rem;
        }
        
        .large {
          padding: 1rem 2rem;
          font-size: 1.2rem;
        }
        
        .full-width {
          width: 100%;
        }
      `}</style>
    </button>
  );
} 