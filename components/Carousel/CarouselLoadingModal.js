import { useMemo } from 'react';
import Modal from '../UI/Modal';
import Button from '../UI/Button';

const CAROUSEL_STEPS = [
  { key: 'preparing_slides', label: 'Preparing Slides', icon: '📝', description: 'Setting up your carousel slides...' },
  { key: 'generating_images', label: 'Generating Images', icon: '🖼️', description: 'Rendering and exporting slide images...' },
  { key: 'generating_caption', label: 'Generating Caption', icon: '💬', description: 'Creating a catchy caption for your carousel...' },
  { key: 'uploading_images', label: 'Uploading Images...', icon: '⬆️', description: 'Uploading images to the cloud...' },
  { key: 'done', label: 'Done!', icon: '✅', description: 'Your carousel is ready!' },
];

export default function CarouselLoadingModal({
  isOpen,
  onClose,
  currentStepIndex = 0,
  error = null,
  slideProgress = null, // { current: number, total: number }
  onCancel = null,
}) {
  const currentStepData = CAROUSEL_STEPS[currentStepIndex] || CAROUSEL_STEPS[0];
  const isLoading = currentStepIndex < CAROUSEL_STEPS.length - 1 && !error;

  // Memoize step descriptions for performance
  const stepDescriptions = useMemo(() => CAROUSEL_STEPS.map(step => step.description), []);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generating Carousel Preview..."
    >
      <div className="loading-container">
        {error && <div className="error-message">Error: {error}</div>}

        <div className="current-step-animation">
          <div className="step-icon">{currentStepData.icon}</div>
        </div>

        <div className="steps-container">
          {CAROUSEL_STEPS.map((step, index) => (
            <div
              key={step.key}
              className={`step ${index === currentStepIndex ? 'active' : ''} ${index < currentStepIndex ? 'completed' : ''}`}
              style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
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
              <div className="step-content" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="step-info">
                  <div className="step-header">
                    <span className="step-label">{step.label}</span>
                  </div>
                  {/* --- Content Area for Each Step --- */}
                  {index === currentStepIndex && (
                    <div className="step-description">{step.description}</div>
                  )}
                  {/* --- Per-slide progress for image generation --- */}
                  {index === 1 && slideProgress && (
                    <div className="slide-progress" style={{ marginTop: 4 }}>
                      Generating slide {slideProgress.current} of {slideProgress.total}
                    </div>
                  )}
                </div>
                {/* Progress bar for Generating Images step, aligned right */}
                {index === 1 && slideProgress && (
                  <div className="progress-bar-side">
                    <div
                      className="progress-fill-side"
                      style={{ width: `${(slideProgress.current / slideProgress.total) * 100}%` }}
                    ></div>
                  </div>
                )}
                {/* Animated progress bar for other loading steps (not images) */}
                {index === currentStepIndex && index !== 1 && isLoading && (
                  <div className="progress-bar">
                    <div className="progress-fill"></div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        {onCancel && isLoading && (
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <Button onClick={onCancel} style={{ background: '#f87171', color: '#fff' }}>Cancel</Button>
          </div>
        )}
      </div>
      <style jsx>{`
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
        .step-content { flex: 1; display: flex; flex-direction: row; align-items: center; gap: 1.5rem; padding-top: 2px; }
        .step-info { flex: 1; width: 100%; }
        .step-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem; }
        .step-label { font-weight: 600; color: #1f2937; font-size: 1rem; }
        .step-description { color: #6b7280; font-size: 0.875rem; }
        .slide-progress { color: #374151; font-size: 0.95rem; margin: 0.5rem 0 0.25rem 0; }
        .progress-bar { width: 120px; height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; margin-left: 1.5rem; }
        .progress-fill { height: 100%; background: #34d399; animation: progress 2s ease-in-out infinite; border-radius: 3px; }
        .progress-bar-side { width: 180px; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; margin-left: 1.5rem; }
        .progress-fill-side { height: 100%; background: #34d399; border-radius: 4px; transition: width 0.3s cubic-bezier(0.4,0,0.2,1); }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes progress { 0% { width: 0%; } 50% { width: 100%; } 100% { width: 0%; margin-left: 100%; } }
        .error-message { text-align: center; margin-bottom: 1rem; padding: 0.75rem 1rem; background-color: #fff1f2; color: #e53e3e; border: 1px solid #fecaca; border-radius: 6px; font-size: 0.9rem; }
      `}</style>
    </Modal>
  );
} 