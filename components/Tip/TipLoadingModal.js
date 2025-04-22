import { useState } from 'react';
import Modal from '../UI/Modal';
import Button from '../UI/Button';
import { FiRefreshCw } from 'react-icons/fi';

// Define the steps for the Tip generation process
const TIP_STEPS = [
  { key: 'fetching_tips', label: 'Finding Tips', icon: '💡', description: 'Searching for relevant tips for \"{category}\"...' }, // Step 0
  { key: 'selecting_tip', label: 'Select Tip', icon: '🤔', description: 'Choose your favorite tip for \"{category}\".' }, // Step 1
  { key: 'generating_image', label: 'Generating Image', icon: '🖼️', description: 'Creating your personalized tip design...' }, // Step 2
];

export default function TipLoadingModal({
  isOpen,
  onClose,
  currentStepIndex = 0, // 0: Fetching, 1: Selecting, 2: Generating
  categoryLabel = '', // Add new prop to receive category label
  tipSuggestions = [], // Array of { advice_heading: string, advice: string }
  selectedTip = null, // The selected { advice_heading: string, advice: string } object
  onSelectTip = () => {}, // (suggestion) => {} - Callback when a tip is selected
  onGenerateClick = () => {}, // Callback when user confirms selection and clicks Generate
  isLoadingFetch = false, // Loading state for fetching tips
  isLoadingGeneration = false, // Loading state for generating the final image
  isLoadingRegeneration = false,
  onRegenerateSuggestions = () => {},
  error = null // Error message to display
}) {

  const currentSteps = TIP_STEPS;
  const currentStepData = currentSteps[currentStepIndex] || currentSteps[0];

  // Determine overall loading state for progress bar animation
  const isLoading = isLoadingFetch || isLoadingGeneration || isLoadingRegeneration;

  // Function to replace placeholder in description
  const getStepDescription = (step) => {
    if (step.key === 'fetching_tips' || step.key === 'selecting_tip') {
      return step.description.replace('{category}', categoryLabel || 'your category');
    }
    return step.description;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generating Tip Design..."
    >
      <div className="loading-container">
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
                    {index === 1 && currentStepIndex === 1 && (
                        <button
                            className="regenerate-button"
                            onClick={onRegenerateSuggestions}
                            disabled={isLoadingRegeneration || isLoadingFetch}
                            title="Get new tip suggestions"
                        >
                            <FiRefreshCw className={isLoadingRegeneration ? 'spinning' : ''} />
                        </button>
                    )}
                  </div>
                  {/* --- Content Area for Each Step --- */}
                  {index === 0 && currentStepIndex === 0 && ( // Fetching Tips
                    <div className="step-description">{getStepDescription(step)}</div>
                  )}

                  {index === 1 && currentStepIndex === 1 && ( // Selecting Tip
                     <div className="tip-selection-area">
                      {tipSuggestions.length > 0 ? (
                         <>
                            <p className="step-description">{getStepDescription(step)}</p>
                            <div className="suggestions-list">
                                {tipSuggestions.map((suggestion, idx) => (
                                    <div
                                        key={idx}
                                        className={`suggestion-item ${selectedTip?.advice_heading === suggestion.advice_heading ? 'selected' : ''}`}
                                        onClick={() => onSelectTip(suggestion)}
                                    >
                                        <p className="suggestion-heading">{suggestion.advice_heading}</p>
                                        <p className="suggestion-advice">{suggestion.advice}</p>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: '1.5rem' }}>
                                <Button
                                    onClick={onGenerateClick}
                                    disabled={!selectedTip || isLoadingGeneration}
                                >
                                    {isLoadingGeneration ? 'Generating...' : 'Select & Generate Image'}
                                </Button>
                            </div>
                         </>
                      ) : (
                         <p className="step-description">
                            {isLoadingFetch || isLoadingRegeneration ? 'Loading suggestions...' : 'Could not fetch tips. Please try again or regenerate.'}
                         </p>
                      )}
                    </div>
                  )}

                  {index === 2 && currentStepIndex === 2 && ( // Generating Image
                    <div className="step-description">{getStepDescription(step)}</div>
                  )}

                  {/* --- Progress Bar for Active Loading Steps --- */}
                  {index === currentStepIndex && isLoading && (
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

      {/* Use the same styling as TestimonialLoadingModal initially */}
      <style jsx>{`
        /* Styles - Copied from TestimonialLoadingModal, adjusted for tip selection */
        .loading-container { padding: 1.5rem; background: #fff; border-radius: 12px; }
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
        .step-content { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; padding-top: 2px; }
        .step-info { flex: 1; width: 100%; }
        .step-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem; }
        .step-label { font-weight: 600; color: #1f2937; font-size: 1rem; }
        .step-description { color: #6b7280; font-size: 0.875rem; }
        .progress-bar { width: 100%; height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; margin-top: 0.75rem; }
        .progress-fill { height: 100%; background: #34d399; animation: progress 2s ease-in-out infinite; border-radius: 3px; }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes progress { 0% { width: 0%; } 50% { width: 100%; } 100% { width: 0%; margin-left: 100%; } }
        .error-message { text-align: center; margin-bottom: 1rem; padding: 0.75rem 1rem; background-color: #fff1f2; color: #e53e3e; border: 1px solid #fecaca; border-radius: 6px; font-size: 0.9rem; }

        /* Tip Selection Specific Styles */
        .tip-selection-area {
             margin-top: 0.75rem;
             width: 100%;
        }
         .suggestions-list {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            margin-top: 1rem;
            max-height: 300px; /* Limit height */
            overflow-y: auto; /* Add scroll if needed */
            padding-right: 5px; /* Space for scrollbar */
         }
        .suggestion-item {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 1rem;
            cursor: pointer;
            transition: all 0.2s ease-in-out;
            background-color: #fff;
        }
        .suggestion-item:hover {
            border-color: #d1d5db;
            background-color: #f9fafb;
        }
        .suggestion-item.selected {
            border-color: #62d76b;
            background-color: #f0fdf4;
            box-shadow: 0 0 0 1px #62d76b;
        }
        .suggestion-heading {
            font-weight: 600;
            color: #1f2937;
            margin: 0 0 0.5rem 0;
            line-height: 1.4;
            text-transform: uppercase;
        }
        .suggestion-advice {
            color: #374151;
            font-size: 0.95rem;
            margin: 0;
            line-height: 1.5;
        }

        /* Add styles for regenerate button */
        .regenerate-button {
            background: none;
            border: none;
            color: #4b5563;
            padding: 0.25rem;
            margin-left: auto;
            cursor: pointer;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        }
        .regenerate-button:hover:not(:disabled) {
            color: #1f2937;
            background-color: #e5e7eb;
        }
        .regenerate-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .regenerate-button svg {
             width: 18px;
             height: 18px;
        }
        .regenerate-button svg.spinning {
             animation: spin 1s linear infinite;
        }

        /* Ensure step-header uses flex */
        .step-header {
             display: flex;
             align-items: center;
             gap: 0.5rem;
             margin-bottom: 0.25rem;
        }

         /* Add spinning keyframes if not already present */
         @keyframes spin {
             from { transform: rotate(0deg); }
             to { transform: rotate(360deg); }
         }
      `}</style>
    </Modal>
  );
} 