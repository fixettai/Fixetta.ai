import React from 'react';
import './Sections.css';

/**
 * HowToUse Component - Step by step guide for using Fixetta AI Estimator
 */
export default function HowToUse() {
  const steps = [
    {
      step: 1,
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
      ),
      title: 'Capture Your Space',
      description: 'Upload or take a picture of your space from various angles. The more perspectives we have, the more accurate our AI estimate will be.'
    },
    {
      step: 2,
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      ),
      title: 'Define Your Scope',
      description: 'Tell us what you want done. Describe the issue, select from common repair categories, or customize your scope of work with specific requirements.'
    },
    {
      step: 3,
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
      ),
      title: 'AI Price Quote',
      description: 'Our AI analyzes your images and scope to generate an instant, detailed price quote. Get accurate material and labor estimates in seconds.'
    },
    {
      step: 4,
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      title: 'Get Matched with a Pro',
      description: 'Once you approve the estimate, we assign a trusted contractor that best fits your needs, budget, and location. Quality work, guaranteed.'
    }
  ];

  return (
    <section className="how-to-use-section" aria-label="How to Use Fixetta">
      <div className="section-container">
        {/* Header */}
        <div className="section-header">
          <span className="section-badge">How It Works</span>
          <h2 className="section-title">Get Your Estimate in 4 Simple Steps</h2>
          <p className="section-subtitle">
            From snapshot to solution - our streamlined workflow gets your project started in minutes, not days.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="steps-grid">
          {steps.map((item) => (
            <div className="step-card" key={item.step}>
              <div className="step-number">{item.step}</div>
              <div className="step-icon">{item.icon}</div>
              <h3 className="step-title">{item.title}</h3>
              <p className="step-description">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Visual Workflow Preview */}
        <div className="workflow-visual">
          <div className="visual-container">
            <div className="visual-steps">
              <div className="visual-step active">
                <div className="visual-step-dot"></div>
                <span>Upload</span>
              </div>
              <div className="visual-step-line"></div>
              <div className="visual-step">
                <div className="visual-step-dot"></div>
                <span>Describe</span>
              </div>
              <div className="visual-step-line"></div>
              <div className="visual-step">
                <div className="visual-step-dot"></div>
                <span>Estimate</span>
              </div>
              <div className="visual-step-line"></div>
              <div className="visual-step">
                <div className="visual-step-dot"></div>
                <span>Matched</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}