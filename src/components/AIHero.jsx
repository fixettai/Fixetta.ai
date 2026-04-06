import React from 'react';
import './AIHero.css';

/**
 * AIHero Component - Clean minimal hero banner for the AI feature
 * Mobile-first, 44x44px minimum touch targets, 12px border radius
 * Clean, minimal aesthetic with no decorative clutter
 */
export default function AIHero({ 
  title = 'Snap the problem.',
  subtitle = 'Get an instant AI estimate for your home repair.',
  ctaText = 'Try Snap AI',
  onCtaClick
}) {
  return (
    <section className="ai-hero" aria-label="AI Home Repair Estimator">
      <div className="hero-content">
        {/* Main heading */}
        <h1 className="hero-heading">
          {title}
        </h1>
        
        {/* Subtitle */}
        <p className="hero-subtitle">{subtitle}</p>
        
        {/* CTA Button */}
        <button 
          className="hero-cta-btn" 
          onClick={onCtaClick}
          aria-label={ctaText}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          {ctaText}
        </button>
      </div>
    </section>
  );
}