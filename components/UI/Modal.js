import { useEffect, useRef } from 'react';

export default function Modal({ isOpen, onClose, children, title, footer }) {
  const modalRef = useRef();
  
  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    }
    
    // Handle escape key press
    function handleEscapeKey(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
      // Prevent scrolling while modal is open
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay">
      <div className="modal-container" ref={modalRef}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="modal-content">
          {children}
        </div>
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
      
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 20px;
          overflow-y: auto;
        }
        
        .modal-container {
          background: linear-gradient(to top, #f2fbf3 0%, #f5fcf6 35%, #ffffff 100%);
          border-radius: 12px;
          width: 90%;
          max-width: 1200px;
          max-height: 90vh;
          box-shadow: 0 5px 30px rgba(0, 0, 0, 0.3);
          display: flex;
          flex-direction: column;
          animation: modalFadeIn 0.3s ease-out;
          overflow: hidden;
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid rgba(234, 234, 234, 0.5);
        }
        
        .modal-header h2 {
          margin: 0;
          font-size: 1.5rem;
          color: #333;
        }
        
        .close-button {
          background: none;
          border: none;
          font-size: 2rem;
          cursor: pointer;
          color: #666;
          padding: 0;
          line-height: 1;
          transition: color 0.2s;
        }
        
        .close-button:hover {
          color: #ff3860;
        }
        
        .modal-content {
          padding: 1.5rem;
          overflow-y: auto;
          flex-grow: 1;
        }
        
        .modal-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid rgba(234, 234, 234, 0.5);
          background-color: rgba(248, 249, 250, 0.5);
        }
        
        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @media (max-width: 768px) {
          .modal-container {
            width: 95%;
            max-height: 95vh;
          }
          
          .modal-header {
            padding: 1rem;
          }
          
          .modal-content {
            padding: 1rem;
          }
          
          .modal-footer {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
} 