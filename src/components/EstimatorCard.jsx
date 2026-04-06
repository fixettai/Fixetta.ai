import React from 'react';
import './EstimatorCard.css';

/**
 * EstimatorCard Component
 * Wraps the AI Estimator in a premium, standalone card container
 * with scenic background and proper visual hierarchy
 */
export default function EstimatorCard({ children, onBack }) {
  return (
    <div className="estimator-page">
      {/* Scenic Background Layer */}
      <div className="estimator-bg" aria-hidden="true">
        <div className="estimator-bg-overlay" />
      </div>

      {/* Foreground Container */}
      <div className="estimator-shell">
        {/* Header Bar */}
        <div className="estimator-topbar">
          {onBack && (
            <button className="estimator-back-btn" onClick={onBack} aria-label="Go back">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
          <div className="estimator-brand">
            <span className="estimator-logo">F</span>
            <span className="estimator-name">Fixetta</span>
          </div>
          <div className="estimator-topbar-spacer" />
          <span className="estimator-badge">AI Estimator</span>
        </div>

        {/* Main Card Container */}
        <div className="estimator-card">
          {children}
        </div>

        {/* Footer */}
        <div className="estimator-footer">
          <span>Powered by Fixetta AI</span>
          <span className="estimator-footer-dot">•</span>
          <span>Instant Estimates</span>
        </div>
      </div>
    </div>
  );
}