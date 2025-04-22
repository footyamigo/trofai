import { useState, useEffect } from 'react';
import Modal from '../UI/Modal';
import Button from '../UI/Button'; // Import Button for the Generate button

// Updated Steps including Caption Generation
const REVIEW_STEPS = [
  { key: 'extracting', label: 'Review Extracted', icon: '✍️', description: 'Review text found. Confirm to generate images.' }, // Step 0: Show review
  { key: 'generating_images', label: 'Generating Images', icon: '🖼️', description: 'Creating beautiful social media ready images' }, // Step 1: Generate
  { key: 'generating_caption', label: 'Creating Caption', icon: '✍️', description: 'Drafting a social media post' } // New Step 2
];

// Renamed component
export default function TestimonialLoadingModal({ 
  isOpen, 
  onClose, 
  currentStepIndex = 0,
  reviewData = null, // { reviewerName, reviewText }
  editedTextValue = '', // <<< Added prop for controlled input value
  onTextChange = () => {}, // <<< Added prop for text change handler
  editedNameValue = '', // <<< Added prop for name value
  onNameChange = () => {}, // <<< Added prop for name change handler
  onGenerateClick = () => {}, // Callback when user confirms review
  isLoadingGeneration = false, // Loading state for the GENERATE step/button
  error = null // Error to display
}) {

  const currentSteps = REVIEW_STEPS;
  const currentStepData = currentSteps[currentStepIndex] || currentSteps[0];

  // Add console log to check received props
  console.log("TestimonialLoadingModal Render - Step:", currentStepIndex, "Review Data:", reviewData, "Error:", error);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Processing Testimonial..." 
    >
      <div className="loading-container">
        {/* Display error if present */} 
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
                  {/* Conditional Description/Content Area */} 
                  {index === 0 ? (
                      // --- Step 0: Show Extracted Review (Now Editable) --- 
                      <div className="review-preview-area">
                          {!reviewData ? (
                              <p className="step-description">Extracting text from image...</p>
                          ) : (
                              <>
                                  {/* Editable Reviewer Name Input */}
                                  <div className="input-group">
                                      <label htmlFor="reviewerNameEdit">Reviewer Name:</label>
                                      <input 
                                          type="text"
                                          id="reviewerNameEdit"
                                          className="reviewer-name-edit" 
                                          value={editedNameValue} 
                                          onChange={(e) => onNameChange(e.target.value)} 
                                          placeholder="Enter reviewer name (optional)"
                                      />
                                  </div>
                                  {/* Editable Review Text Textarea */}
                                   <div className="input-group">
                                      <label htmlFor="reviewTextEdit">Review Text:</label>
                                      <textarea 
                                          id="reviewTextEdit"
                                          className="review-text-edit" 
                                          value={editedTextValue} 
                                          onChange={(e) => onTextChange(e.target.value)} 
                                          placeholder="Enter or edit review text..."
                                          rows={6} 
                                      />
                                  </div>
                                  <Button 
                                      onClick={onGenerateClick} 
                                      disabled={isLoadingGeneration || !editedTextValue} // Disable if text is empty
                                      style={{marginTop: '1rem'}}
                                  > 
                                    Confirm & Generate Content
                                  </Button>
                              </>
                          )}
                      </div>
                  ) : ( 
                      // --- Steps 1 & 2: Show Generation Progress --- 
                      <>
                          <div className="step-description">{step.description}</div>
                          {index === currentStepIndex && (
                              <div className="progress-bar">
                                  {/* Show continuous animation only while generating (steps 1 and 2) */} 
                                  {(isLoadingGeneration || currentStepIndex > 0) && 
                                      <div className="progress-fill"></div>
                                  }
                              </div>
                          )}
                      </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <style jsx>{`
        /* Styles */
        .loading-container { padding: 1.5rem; background: #fff; /* Cleaner background */ border-radius: 12px; }
        .current-step-animation { display: flex; justify-content: center; margin: 1.5rem 0; }
        .step-icon { font-size: 2.5rem; animation: bounce 1s infinite; }
        .steps-container { display: flex; flex-direction: column; gap: 1rem; }
        .step { display: flex; align-items: flex-start; gap: 1rem; padding: 1rem; border-radius: 8px; background: #f9fafb; border: 1px solid #f3f4f6; }
        .step.active { border-color: #d1fae5; background: #f0fdf4; }
        .step-number { width: 24px; height: 24px; flex-shrink: 0; }
        .step-completed, .step-active, .step-inactive { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 500; font-size: 0.875rem; }
        .step-completed { background: #10b981; color: white; }
        .step-active { background: #34d399; color: white; }
        .step-inactive { background: #e5e7eb; color: #6b7280; }
        .step-content { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; padding-top: 2px; /* Align content slightly */}
        .step-info { flex: 1; width: 100%; }
        .step-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem; }
        .step-label { font-weight: 600; color: #1f2937; font-size: 1rem; }
        .step-description { color: #6b7280; font-size: 0.875rem; }
        .progress-bar { width: 100%; height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; margin-top: 0.75rem; }
        .progress-fill { height: 100%; background: #34d399; animation: progress 2s ease-in-out infinite; border-radius: 3px; }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes progress { 0% { width: 0%; } 50% { width: 100%; } 100% { width: 0%; margin-left: 100%; } }
        .error-message { text-align: center; margin-bottom: 1rem; padding: 0.75rem 1rem; background-color: #fff1f2; color: #e53e3e; border: 1px solid #fecaca; border-radius: 6px; font-size: 0.9rem; }
        
        /* Adjusted Review Preview Styles */
        .review-preview-area { 
            margin-top: 0.75rem; 
            padding: 0; /* Remove padding */
            background-color: transparent; /* Remove background */
            border: none; /* Remove border */
        }
        .reviewer-name { 
            font-size: 0.9rem; 
            color: #4b5563; 
            margin: 0 0 0.5rem 0; 
        }
         /* Use editable textarea */
        .review-text-edit { 
            font-size: 0.95rem; 
            color: #1f2937; 
            line-height: 1.6; 
            margin: 0;
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            resize: vertical;
            min-height: 100px; /* Adjust min height */
        }
        .review-text-edit:focus {
            outline: none;
            border-color: #62d76b;
            box-shadow: 0 0 0 2px rgba(98, 215, 107, 0.2);
        }

        /* Added Styles for Input Grouping */
        .input-group {
            margin-bottom: 1rem;
        }
        .input-group label {
            display: block;
            font-weight: 500;
            color: #4b5563;
            font-size: 0.9rem;
            margin-bottom: 0.3rem;
        }

        /* Styles for Reviewer Name Input */
        .reviewer-name-edit {
            font-size: 0.95rem; 
            color: #1f2937; 
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #d1d5db;
            border-radius: 6px;
        }
         .reviewer-name-edit:focus {
            outline: none;
            border-color: #62d76b;
            box-shadow: 0 0 0 2px rgba(98, 215, 107, 0.2);
        }
      `}</style>
    </Modal>
  );
} 