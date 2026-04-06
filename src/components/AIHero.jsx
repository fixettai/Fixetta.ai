import React from 'react';
import './AIHero.css';

// Asset references from Stitch design
const ASSET_BASE = '/assets/stitch';

/**
 * AIHero Component - Neomorphic hero banner for the AI feature
 * Displays the main call-to-action for the Snap AI feature
 * Mobile-first, 44x44px minimum touch targets
 */
export default function AIHero({ 
  title = 'Snap the problem.',
  highlight = 'Get it fixed fast.',
  subtitle = 'One photo → AI estimate → local pro booked',
  ctaText = 'Try Snap AI',
  onCtaClick,
  location = 'Richmond, VA',
  imageSrc = `${ASSET_BASE}/3d_ai_companion_main_view/screen.png`,
  imageAlt = 'AI analysis illustration'
}) {
  return (
    <section className="ai-hero neo-raised" aria-label="AI Home Repair Estimator">
      {/* Background decorative elements */}
      <div className="hero-bg-circle hero-bg-circle--tl" aria-hidden="true" />
      <div className="hero-bg-circle hero-bg-circle--br" aria-hidden="true" />
      
      <div className="hero-content">
        {/* Location badge */}
        <div className="hero-badge">
          <span className="badge-dot" aria-hidden="true" />
          Live in {location}
        </div>
        
        {/* Main heading */}
        <h1 className="hero-heading">
          {title}
          <br />
          <span className="hero-highlight">{highlight}</span>
        </h1>
        
        {/* Subtitle */}
        <p className="hero-subtitle">{subtitle}</p>
        
        {/* CTA Button */}
        <button 
          className="hero-cta-btn neo-btn neo-btn-primary" 
          onClick={onCtaClick}
          aria-label={ctaText}
          style={{ minWidth: 44, minHeight: 44 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          {ctaText}
        </button>
      </div>
      
      {/* Optional hero image */}
      {imageSrc && (
        <div className="hero-image-wrapper" aria-hidden="true">
          <img src={imageSrc} alt={imageAlt} className="hero-image" />
        </div>
      )}
    </section>
  );
}