import { useState, useEffect } from 'react';
import Modal from './Modal';

const STEPS = [
  { 
    key: 'scraping', 
    label: 'Scraping Property Details', 
    emoji: '🏠', 
    icon: '🏠',
    description: 'Fetching all property information and images from the listing'
  },
  { 
    key: 'extracting', 
    label: 'Extracting information', 
    emoji: '📊', 
    icon: '📊',
    description: 'Processing and organizing the property data'
  },
  { 
    key: 'generating', 
    label: 'Designing Social MediaImages', 
    emoji: '🖼️', 
    icon: '🖼️',
    description: 'Creating beautiful social media ready images'
  },
  { 
    key: 'creating', 
    label: 'Creating Caption', 
    emoji: '✍️', 
    icon: '✍️',
    description: 'Generating engaging captions for your property'
  }
];

export default function LoadingModal({ 
  isOpen, 
  onClose, 
  url = '', 
  currentStep = 0,
  caption = '',
  captionOptions = null,
  onCaptionEdit = () => {}
}) {
  // Initialize states for both caption options
  const [mainCaption, setMainCaption] = useState(caption);
  const [altCaption, setAltCaption] = useState("");
  const [selectedCaption, setSelectedCaption] = useState("main");
  
  // Update local state when the caption prop changes
  useEffect(() => {
    if (captionOptions) {
      setMainCaption(captionOptions.main || caption);
      setAltCaption(captionOptions.alternative || "");
    } else {
      setMainCaption(caption);
    }
  }, [caption, captionOptions]);
  
  // Get current step info
  const getCurrentStep = () => {
    return STEPS[currentStep] || STEPS[0];
  };
  
  // Handle caption changes
  const handleMainCaptionChange = (e) => {
    const newCaption = e.target.value;
    setMainCaption(newCaption);
    if (selectedCaption === "main") {
      onCaptionEdit(newCaption);
    }
  };
  
  const handleAltCaptionChange = (e) => {
    const newCaption = e.target.value;
    setAltCaption(newCaption);
    if (selectedCaption === "alt") {
      onCaptionEdit(newCaption);
    }
  };
  
  // Handle caption selection
  const handleSelectCaption = (type) => {
    setSelectedCaption(type);
    onCaptionEdit(type === "main" ? mainCaption : altCaption);
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Processing Your Request"
    >
      <div className="loading-container">
        <div className="url-section">
          <div className="url-label">
            <span className="url-icon">🔗</span>
            Property URL
          </div>
          <div className="url-value">{url}</div>
        </div>

        <div className="current-step-animation">
          <div className="step-icon">{getCurrentStep().icon}</div>
        </div>

        <div className="steps-container">
          {STEPS.map((step, index) => (
            <div 
              key={step.key} 
              className={`step ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
            >
              <div className="step-number">
                {index < currentStep ? (
                  <div className="step-completed">✓</div>
                ) : (
                  <div className={index === currentStep ? 'step-active' : 'step-inactive'}>
                    {index + 1}
                  </div>
                )}
              </div>
              <div className="step-content">
                <div className="step-info">
                  <div className="step-header">
                    <span className="step-emoji">{step.icon}</span>
                    <span className="step-label">{step.label}</span>
                  </div>
                  <div className="step-description">{step.description}</div>
                </div>
                {index === currentStep && (
                  <div className="progress-bar">
                    <div className="progress-fill"></div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {currentStep === 3 && (
          <div className="caption-editor">
            <h4 className="caption-title">Choose and Edit Caption</h4>
            
            <div className="caption-tabs">
              <button 
                className={`tab-button ${selectedCaption === 'main' ? 'active' : ''}`}
                onClick={() => handleSelectCaption('main')}
              >
                Option 1
              </button>
              {captionOptions && captionOptions.alternative && (
                <button 
                  className={`tab-button ${selectedCaption === 'alt' ? 'active' : ''}`}
                  onClick={() => handleSelectCaption('alt')}
                >
                  Option 2
                </button>
              )}
            </div>
            
            <div className="caption-options">
              <div className={`caption-option ${selectedCaption === 'main' ? 'active' : ''}`}>
                <textarea
                  className="caption-textarea"
                  value={mainCaption}
                  onChange={handleMainCaptionChange}
                  placeholder="Your caption will appear here for editing..."
                  rows={10}
                />
              </div>
              
              {captionOptions && captionOptions.alternative && (
                <div className={`caption-option ${selectedCaption === 'alt' ? 'active' : ''}`}>
                  <textarea
                    className="caption-textarea"
                    value={altCaption}
                    onChange={handleAltCaptionChange}
                    placeholder="Alternative caption option..."
                    rows={10}
                  />
                </div>
              )}
            </div>
            
            <div className="caption-tips">
              <p>💡 <strong>Tip:</strong> Edit the caption to highlight key features and benefits of the property.</p>
            </div>
          </div>
        )}
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

        .caption-editor {
          width: 100%;
          padding: 1rem;
          background-color: #f9f9f9;
          border-radius: 8px;
          border: 1px solid #eaeaea;
        }
        
        .caption-title {
          margin-top: 0;
          margin-bottom: 0.5rem;
          font-size: 1rem;
          color: #333;
        }
        
        .caption-tabs {
          display: flex;
          margin-bottom: 1rem;
          border-bottom: 1px solid #eaeaea;
        }
        
        .tab-button {
          padding: 0.5rem 1rem;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          cursor: pointer;
          font-weight: 500;
          color: #666;
          transition: all 0.2s ease;
        }
        
        .tab-button.active {
          color: #62d76b;
          border-bottom-color: #62d76b;
        }
        
        .caption-options {
          position: relative;
        }
        
        .caption-option {
          display: none;
          width: 100%;
        }
        
        .caption-option.active {
          display: block;
        }
        
        .caption-textarea {
          width: 100%;
          padding: 0.8rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-family: inherit;
          font-size: 0.9rem;
          resize: vertical;
        }
        
        .caption-textarea:focus {
          outline: none;
          border-color: #62d76b;
          box-shadow: 0 0 0 2px rgba(98, 215, 107, 0.2);
        }
        
        .caption-tips {
          margin-top: 0.5rem;
          padding: 0.5rem;
          background-color: #f0f0f0;
          border-radius: 4px;
          border: 1px solid #ddd;
        }
      `}</style>
    </Modal>
  );
} 