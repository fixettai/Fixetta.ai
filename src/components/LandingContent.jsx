import React from 'react';
import './LandingContent.css';
import landingImage from '../../assets/Landing page header.jpg';

/**
 * LandingContent Component - Secondary containers on the main landing page
 * Displays workflow containers, trust indicators, and the hero image
 */
export default function LandingContent({ onStartEstimate }) {
  const workflowSteps = [
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
      ),
      step: 1,
      title: 'Upload Photos',
      description: 'Take or upload pictures of your space from multiple angles for the best analysis.'
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      ),
      step: 2,
      title: 'Describe Your Project',
      description: 'Tell us what needs to be done and customize your scope of work.'
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      ),
      step: 3,
      title: 'Get Your Quote',
      description: 'Receive an instant AI-powered price quote with detailed cost breakdown.'
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="8.5" cy="7" r="4"/>
          <polyline points="17 11 19 13 23 9"/>
        </svg>
      ),
      step: 4,
      title: 'Get Matched',
      description: 'We assign the perfect contractor for your project based on your needs.'
    }
  ];

  const trustIndicators = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      ),
      label: 'Verified Contractors'
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
      label: 'Instant Estimates'
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      ),
      label: 'Transparent Pricing'
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      label: '500+ Happy Homeowners'
    }
  ];

  return (
    <div className="landing-content">
      {/* Hero Image Section */}
      <section className="landing-hero-image">
        <div className="image-wrapper">
          <img 
            src={landingImage} 
            alt="Fixetta AI Home Repair Estimator - Transform your space with confidence" 
            className="hero-image"
          />
          <div className="image-overlay">
            <div className="image-text">
              <h2>Transform Your Space</h2>
              <p>AI-powered estimates. Trusted contractors. One platform.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="landing-workflow-section" aria-label="How Fixetta Works">
        <div className="landing-section-container">
          <div className="landing-section-header">
            <span className="landing-section-badge">Simple Process</span>
            <h2 className="landing-section-title">How Fixetta Works</h2>
            <p className="landing-section-subtitle">
              From photo to project completion in four easy steps. No hidden fees, no surprises.
            </p>
          </div>

          <div className="workflow-grid">
            {workflowSteps.map((step) => (
              <div className="workflow-card" key={step.step}>
                <div className="workflow-step-number">{step.step}</div>
                <div className="workflow-icon">{step.icon}</div>
                <h3 className="workflow-title">{step.title}</h3>
                <p className="workflow-description">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Indicators Section */}
      <section className="landing-trust-section" aria-label="Why Choose Fixetta">
        <div className="landing-section-container">
          <div className="trust-grid">
            {trustIndicators.map((item, index) => (
              <div className="trust-card" key={index}>
                <div className="trust-icon">{item.icon}</div>
                <span className="trust-label">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Fixetta Section */}
      <section className="landing-features-section" aria-label="Fixetta Features">
        <div className="landing-section-container">
          <div className="landing-section-header">
            <span className="landing-section-badge">Why Fixetta</span>
            <h2 className="landing-section-title">Built for Homeowners, Powered by AI</h2>
            <p className="landing-section-subtitle">
              We combine cutting-edge artificial intelligence with local expertise to deliver the most accurate repair estimates in the industry.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <h3>Smart AI Analysis</h3>
              <p>Our advanced AI vision system analyzes your photos to identify repair needs and generates accurate cost estimates in seconds.</p>
              <p className="feature-placeholder">[Add more details about your AI technology, accuracy metrics, and capabilities]</p>
            </div>
            <div className="feature-card">
              <h3>Vetted Professionals</h3>
              <p>Every contractor in our network is thoroughly vetted, licensed, and insured. We match you with the best fit for your specific project.</p>
              <p className="feature-placeholder">[Add information about contractor vetting process, insurance coverage, and quality standards]</p>
            </div>
            <div className="feature-card">
              <h3>Transparent Pricing</h3>
              <p>No hidden fees, no surprises. Get detailed cost breakdowns including materials, labor, and timeline before committing to any work.</p>
              <p className="feature-placeholder">[Add details about pricing methodology, what's included in estimates, and guarantees]</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}