import { useState, useEffect } from 'react';
import Modal from './Modal';

const STEPS = [
  { key: 'scraping', label: 'Scraping Property Details', icon: '🏠', description: 'Fetching all property information and images from the listing' },
  { key: 'extracting', label: 'Extracting information', icon: '📊', description: 'Processing and organizing the property data' },
  { key: 'generating', label: 'Designing Social Media Images', icon: '🖼️', description: 'Creating beautiful social media ready images' },
  { key: 'creating', label: 'Creating Caption', icon: '✍️', description: 'Generating engaging captions for your property' }
];

export default function LoadingModal({ 
  isOpen, 
  onClose, 
  url = '', 
  currentStepIndex = 0,
  steps,
  error = null
}) {
  const currentSteps = steps || STEPS;
  const currentStepData = currentSteps[currentStepIndex] || currentSteps[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Processing Your Request"
    >
      <div className="loading-container">
        {url && (
          <div className="url-section">
            <div className="url-label">
              <span className="url-icon">🔗</span>
              Property URL
            </div>
            <div className="url-value">{url}</div>
          </div>
        )}

        {error && <div className="error-message">Error: {error}</div>}

        <div className="current-step-animation">
          <div className="step-icon">{currentStepData.icon}</div>
        </div>

        <div className="steps-container">
          {currentSteps.map((step, index) => (
            <div 
              key={step.key} 
              className={`step ${index === currentStepIndex ? 'active' : ''} ${index < currentStepIndex ? 'completed' : ''}`}
            >
              <div className="step-number">
                {index < currentStepIndex ? (
                  <div className="step-completed">✓</div>
                ) : (
                  <div className={index === currentStepIndex ? 'step-active' : 'step-inactive'}>
                    {index + 1}
                  </div>
                )}
              </div>
              <div className="step-content">
                <div className="step-info">
                  <div className="step-header">
                    <span className="step-label">{step.label}</span>
                  </div>
                  <div className="step-description">{step.description}</div>
                  {index === currentStepIndex && (
                    <div className="progress-bar">
                      <div className="progress-fill"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <style jsx>{`
        .loading-container {
          padding: 1.5rem;
          background: linear-gradient(to top, #f2fbf3, #f5fcf6, #ffffff);
          border-radius: 12px;
        }

        .url-section {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 2rem;
        }

        .url-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #4a5568;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }

        .url-value {
          font-family: 'SF Mono', 'Roboto Mono', monospace;
          font-size: 0.9rem;
          color: #2d3748;
          word-break: break-all;
        }

        .current-step-animation {
          display: flex;
          justify-content: center;
          margin: 2rem 0;
        }

        .step-icon {
          font-size: 2.5rem;
          animation: bounce 1s infinite;
        }

        .steps-container {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .step {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 0.75rem;
          border-radius: 8px;
          background: white;
          border: 1px solid #e2e8f0;
        }

        .step.active {
          border-color: #62d76b;
          background: rgba(98, 215, 107, 0.05);
        }

        .step-number {
          width: 24px;
          height: 24px;
          flex-shrink: 0;
        }

        .step-completed,
        .step-active,
        .step-inactive {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 500;
          font-size: 0.875rem;
        }

        .step-completed {
          background: #62d76b;
          color: white;
        }

        .step-active {
          background: #62d76b;
          color: white;
        }

        .step-inactive {
          background: #e2e8f0;
          color: #4a5568;
        }

        .step-content {
          flex: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }

        .step-info {
          flex: 1;
        }

        .step-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.25rem;
        }

        .step-emoji {
          font-size: 1.25rem;
        }

        .step-label {
          font-weight: 500;
          color: #2d3748;
        }

        .step-description {
          color: #718096;
          font-size: 0.875rem;
        }

        .progress-bar {
          width: 200px;
          height: 4px;
          background: #e2e8f0;
          border-radius: 2px;
          overflow: hidden;
          flex-shrink: 0;
        }

        .progress-fill {
          height: 100%;
          background: #62d76b;
          animation: progress 2s ease-in-out infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes progress {
          0% { width: 0%; }
          50% { width: 100%; }
          100% { width: 0%; margin-left: 100%; }
        }

        .error-message {
          text-align: center;
          margin-bottom: 1rem;
          padding: 0.75rem 1rem;
          background-color: #fff5f5;
          color: #c53030;
          border: 1px solid #fed7d7;
          border-radius: 6px;
          font-size: 0.9rem;
        }
      `}</style>
    </Modal>
  );
} 