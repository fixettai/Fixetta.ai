import React from 'react';
import './Sections.css';

/**
 * AboutUs Component - Company information and mission statement
 */
export default function AboutUs() {
  const teamValues = [
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      ),
      title: 'Trust First',
      description: 'We believe transparency builds better relationships. Every estimate, every contractor match, every interaction is designed with your trust in mind.'
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
      ),
      title: 'AI-Powered',
      description: 'Leveraging cutting-edge AI technology to provide accurate, instant estimates that save you time and eliminate guesswork from home repairs.'
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      ),
      title: 'Homeowner Focused',
      description: 'Everything we build starts with the homeowner experience. We simplify the complex, making quality home repairs accessible to everyone.'
    }
  ];

  return (
    <section className="about-us-section" aria-label="About Fixetta">
      <div className="section-container">
        {/* Header */}
        <div className="section-header">
          <span className="section-badge">Our Story</span>
          <h2 className="section-title">Building Trust in Home Repair</h2>
          <p className="section-subtitle">
            Fixetta was born from a simple observation: home repairs shouldn't be a guessing game. We're on a mission to transform how homeowners connect with quality contractors.
          </p>
        </div>

        {/* Mission Content */}
        <div className="about-content">
          {/* Mission Statement */}
          <div className="about-mission">
            <div className="mission-image">
              <div className="image-placeholder">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mission-icon">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
            </div>
            <div className="mission-text">
              <h3>Our Mission</h3>
              <p>
                To democratize access to reliable, transparent, and affordable home repair services through AI-powered technology. We believe every homeowner deserves accurate cost estimates and trusted professionals, regardless of their budget or project size.
              </p>
              <p>
                [Add your mission statement here when ready]
              </p>
            </div>
          </div>

          {/* Values Grid */}
          <div className="values-section">
            <h3 className="values-title">What We Stand For</h3>
            <div className="values-grid">
              {teamValues.map((value, index) => (
                <div className="value-card" key={index}>
                  <div className="value-icon">{value.icon}</div>
                  <h4 className="value-title">{value.title}</h4>
                  <p className="value-description">{value.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Team Section Placeholder */}
          <div className="team-section">
            <h3>Meet the Team</h3>
            <p className="team-placeholder">
              [Team member photos and bios will go here. Add your leadership team, key developers, and support staff information when ready.]
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}