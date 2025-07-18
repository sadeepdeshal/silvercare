import React, { useState, useEffect } from 'react';
import styles from './css/OnboardingTour.module.css';

// Inject global styles for tour highlighting
const injectTourStyles = () => {
  const styleId = 'tour-styles';
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes tour-pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(52, 152, 219, 0.4), 0 0 20px rgba(52, 152, 219, 0.2) !important;
      }
      70% {
        box-shadow: 0 0 0 10px rgba(52, 152, 219, 0), 0 0 20px rgba(52, 152, 219, 0.2) !important;
      }
      100% {
        box-shadow: 0 0 0 0 rgba(52, 152, 219, 0), 0 0 20px rgba(52, 152, 219, 0.2) !important;
      }
    }
  `;
  document.head.appendChild(style);
};

const OnboardingTour = ({ steps, isActive, onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isActive && steps.length > 0) {
      injectTourStyles(); // Inject global styles
      setCurrentStep(0);
      setTimeout(() => {
        showStep(0);
      }, 500); // Delay to ensure DOM is ready
    }
  }, [isActive, steps]);

  useEffect(() => {
    if (isActive && currentStep < steps.length) {
      showStep(currentStep);
    }
  }, [currentStep, isActive]);

  const showStep = (stepIndex) => {
    const step = steps[stepIndex];
    if (!step) return;

    const element = document.querySelector(step.target);
    if (element) {
      // Remove highlight from all elements first
      document.querySelectorAll('.tour-highlighted').forEach(el => {
        el.classList.remove('tour-highlighted');
        el.style.position = '';
        el.style.zIndex = '';
        el.style.boxShadow = '';
        el.style.border = '';
        el.style.borderRadius = '';
      });

      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Calculate tooltip position
      setTimeout(() => {
        const rect = element.getBoundingClientRect();
        const tooltipPosition = calculateTooltipPosition(rect, step.placement);
        setTooltipPosition(tooltipPosition);
        
        // Highlight element with inline styles for better compatibility
        element.classList.add('tour-highlighted');
        element.style.position = 'relative';
        element.style.zIndex = '1000';
        element.style.boxShadow = '0 0 0 4px rgba(52, 152, 219, 0.3), 0 0 20px rgba(52, 152, 219, 0.2)';
        element.style.border = '2px solid #3498db';
        element.style.borderRadius = '8px';
        element.style.transition = 'all 0.3s ease';
        
        // Add pulsing animation
        element.style.animation = 'tour-pulse 2s infinite';
      }, 100);
    }
  };

  const calculateTooltipPosition = (rect, placement = 'bottom') => {
    const tooltipWidth = 320;
    const tooltipHeight = 200;
    const offset = 20;
    
    let top, left;
    
    switch (placement) {
      case 'top':
        top = rect.top - tooltipHeight - offset;
        left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        break;
      case 'right':
        top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        left = rect.right + offset;
        break;
      case 'left':
        top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        left = rect.left - tooltipWidth - offset;
        break;
      case 'bottom':
      default:
        top = rect.bottom + offset;
        left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        break;
    }
    
    // Ensure tooltip stays within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    if (left < 10) left = 10;
    if (left + tooltipWidth > viewportWidth - 10) left = viewportWidth - tooltipWidth - 10;
    if (top < 10) top = 10;
    if (top + tooltipHeight > viewportHeight - 10) top = viewportHeight - tooltipHeight - 10;
    
    return { top, left };
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTour = () => {
    // Remove all highlights
    document.querySelectorAll('.tour-highlighted').forEach(el => {
      el.classList.remove('tour-highlighted');
      el.style.position = '';
      el.style.zIndex = '';
      el.style.boxShadow = '';
      el.style.border = '';
      el.style.borderRadius = '';
      el.style.animation = '';
    });
    onComplete();
  };

  const skipTour = () => {
    // Remove all highlights
    document.querySelectorAll('.tour-highlighted').forEach(el => {
      el.classList.remove('tour-highlighted');
      el.style.position = '';
      el.style.zIndex = '';
      el.style.boxShadow = '';
      el.style.border = '';
      el.style.borderRadius = '';
      el.style.animation = '';
    });
    onSkip();
  };

  if (!isActive || !steps.length) return null;

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <>
      {/* Overlay */}
      <div className={styles.overlay} />
      
      {/* Tooltip */}
      <div 
        className={styles.tooltip}
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        <div className={styles.tooltipHeader}>
          <span className={styles.stepCounter}>
            Step {currentStep + 1} of {steps.length}
          </span>
          <button 
            className={styles.closeButton}
            onClick={skipTour}
          >
            ×
          </button>
        </div>
        
        <div className={styles.tooltipContent}>
          <h3>{currentStepData.title}</h3>
          <p>{currentStepData.content}</p>
        </div>
        
        <div className={styles.tooltipFooter}>
          <button 
            className={styles.skipButton}
            onClick={skipTour}
          >
            Skip Tour
          </button>
          
          <div className={styles.navigationButtons}>
            {currentStep > 0 && (
              <button 
                className={styles.prevButton}
                onClick={prevStep}
              >
                Previous
              </button>
            )}
            
            <button 
              className={styles.nextButton}
              onClick={nextStep}
            >
              {isLastStep ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill}
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </>
  );
};

export default OnboardingTour;
