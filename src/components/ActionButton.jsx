import React from 'react';
import './ActionButton.css';

/**
 * ActionButton Component - Clean minimal submit button
 * Packages user input and handles submission flow
 * Mobile-first, 44x44px minimum touch targets, 12px border radius
 */
export default function ActionButton({
  label = 'Get Estimate',
  loadingLabel = 'Analyzing...',
  onSubmit,
  isLoading = false,
  isDisabled = false,
  formData = null,
}) {
  // Handle button click - package data and submit
  const handleClick = () => {
    if (isLoading || isDisabled) return;

    // Package request object for OpenRouter backend
    const requestPayload = {
      scope: {
        description: formData?.description || '',
        category: formData?.category || '',
      },
      contact: {
        name: formData?.name || '',
        email: formData?.email || '',
        phone: formData?.phone || '',
        zip: formData?.zip || '',
      },
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'fixetta-web',
      },
    };

    // Submit handler receives the packaged payload
    if (onSubmit) {
      onSubmit(requestPayload);
    }
  };

  return (
    <div className="action-button-wrapper">
      <button
        className={`action-btn ${isLoading ? 'loading' : ''}`}
        onClick={handleClick}
        disabled={isLoading || isDisabled}
        aria-busy={isLoading}
        aria-label={isLoading ? loadingLabel : label}
      >
        {isLoading ? (
          <>
            <span className="btn-spinner" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
            </span>
            <span>{loadingLabel}</span>
          </>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>{label}</span>
          </>
        )}
      </button>
    </div>
  );
}