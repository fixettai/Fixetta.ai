import React from 'react';
import './ActionButton.css';

/**
 * ActionButton Component - Primary action button for submission flow
 * Packages user's text and image into a single request object for OpenRouter backend
 * Mobile-first with neomorphic design, 44x44px minimum touch targets
 */
export default function ActionButton({
  label = 'Submit for AI Analysis',
  loadingLabel = 'Analyzing...',
  onClick,
  isLoading = false,
  isDisabled = false,
  variant = 'primary', // 'primary' | 'secondary'
  icon = null,
  className = '',
  formData = null,
  photos = [],
}) {
  // Handle button click with optional request packaging
  const handleClick = () => {
    if (isLoading || isDisabled) return;
    
    // Package request object if formData is provided
    if (formData && onClick) {
      const requestPayload = {
        scope: {
          description: formData.description || '',
          category: formData.category || '',
        },
        contact: {
          name: formData.name || '',
          email: formData.email || '',
          phone: formData.phone || '',
          zip: formData.zip || '',
        },
        photos: photos.map((photo) => ({
          url: photo.url || photo.src || '',
          name: photo.name || '',
          type: photo.type || '',
        })),
        metadata: {
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        },
      };
      
      onClick(requestPayload);
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <button
      className={`action-btn neo-btn ${variant === 'primary' ? 'action-btn--primary' : ''} ${isLoading ? 'action-btn--loading' : ''} ${className}`}
      onClick={handleClick}
      disabled={isLoading || isDisabled}
      aria-busy={isLoading}
      aria-label={isLoading ? loadingLabel : label}
      style={{ minHeight: 44 }}
    >
      {isLoading ? (
        <>
          <span className="action-btn__spinner" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 12a9 9 0 11-6.219-8.56"  strokeLinecap="round"/>
            </svg>
          </span>
          <span>{loadingLabel}</span>
        </>
      ) : (
        <>
          {icon && <span className="action-btn__icon" aria-hidden="true">{icon}</span>}
          <span>{label}</span>
        </>
      )}
    </button>
  );
}