import { useState, useEffect } from 'react';

// Steps in the generation process
const STEPS = [
  { key: 'scraping', label: 'Scraping URL', icon: '🔍' },
  { key: 'analyzing', label: 'Analyzing Property Data', icon: '📊' },
  { key: 'generating', label: 'Generating Images', icon: '🖼️' },
  { key: 'creating', label: 'Creating Caption', icon: '✍️' }
];

export default function ProgressIndicator({ currentStep = 0, isComplete = false }) {
  const [progress, setProgress] = useState(0);
  
  // Animate progress bar
  useEffect(() => {
    if (isComplete) {
      setProgress(100);
      return;
    }
    
    const stepSize = 100 / STEPS.length;
    const targetProgress = (currentStep / STEPS.length) * 100;
    
    // Animate to the current step percentage
    setProgress(targetProgress);
    
    // If we're on a step (not complete), animate progress within that step
    if (currentStep < STEPS.length) {
      const timer = setInterval(() => {
        setProgress(prev => {
          const nextStep = ((currentStep + 1) / STEPS.length) * 100;
          const increment = Math.random() * 0.5; // Small random increment for natural effect
          const newProgress = Math.min(prev + increment, nextStep - 5); // Don't go into next step
          return newProgress;
        });
      }, 500);
      
      return () => clearInterval(timer);
    }
  }, [currentStep, isComplete]);
  
  return (
    <div className="progress-container">
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
      </div>
      
      <div className="steps-container">
        {STEPS.map((step, index) => (
          <div
            key={step.key}
            className={`step ${index === currentStep ? 'active' : ''} ${index < currentStep || isComplete ? 'completed' : ''}`}
          >
            <div className="step-icon">
              {step.icon}
              {index < currentStep || isComplete ? (
                <span className="check">✓</span>
              ) : index === currentStep ? (
                <span className="pulse"></span>
              ) : null}
            </div>
            <div className="step-label">{step.label}</div>
          </div>
        ))}
      </div>
      
      <style jsx>{`
        .progress-container {
          width: 100%;
          padding: 2rem 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
        }
        
        .progress-bar {
          width: 100%;
          height: 8px;
          background: #eaeaea;
          border-radius: 10px;
          overflow: hidden;
          position: relative;
        }
        
        .progress-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: linear-gradient(90deg, #4CAF50, #8BC34A);
          border-radius: 10px;
          transition: width 0.5s ease;
        }
        
        .steps-container {
          display: flex;
          justify-content: space-between;
          width: 100%;
        }
        
        .step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          width: 90px;
          text-align: center;
          position: relative;
        }
        
        .step-icon {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          position: relative;
          border: 2px solid #eaeaea;
          transition: all 0.3s ease;
        }
        
        .step.active .step-icon {
          background: #fff;
          border-color: #4CAF50;
          box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.2);
        }
        
        .step.completed .step-icon {
          background: #4CAF50;
          border-color: #4CAF50;
          color: white;
        }
        
        .step-label {
          font-size: 0.8rem;
          font-weight: 500;
          color: #666;
          transition: color 0.3s ease;
        }
        
        .step.active .step-label {
          color: #4CAF50;
          font-weight: 600;
        }
        
        .step.completed .step-label {
          color: #333;
        }
        
        .check {
          position: absolute;
          top: 0;
          right: -3px;
          background: #4CAF50;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          font-weight: bold;
          border: 2px solid white;
        }
        
        .pulse {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: rgba(76, 175, 80, 0.3);
          animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
          0% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0.8;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1);
            opacity: 0;
          }
          100% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0;
          }
        }
        
        @media (max-width: 600px) {
          .steps-container {
            flex-wrap: wrap;
            justify-content: center;
            gap: 1.5rem;
          }
          
          .step {
            width: 80px;
          }
        }
      `}</style>
    </div>
  );
} 