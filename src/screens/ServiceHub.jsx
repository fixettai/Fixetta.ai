import React, { useState, useCallback, useMemo } from 'react';
import Header from '../components/Header';
import AIHero from '../components/AIHero';
import AIChat from '../components/AIChat';
import LandingContent from '../components/LandingContent';
import HowToUse from '../components/HowToUse';
import AboutUs from '../components/AboutUs';
import ContactUs from '../components/ContactUs';
import { useSEO, buildServiceSchema } from '../hooks/useSEO';
import './ServiceHub.css';

// ── SEO Constants ──────────────────────────────────────────────────────────
const SEO_CONFIG = {
  home: {
    title: 'AI Home Repair Estimate in Richmond, VA | Fixetta',
    description: 'Get instant AI-powered home repair cost estimates in Richmond, VA. Upload photos, compare contractors, and book trusted local pros.',
    canonical: 'https://fixetta.ai/',
  },
  chat: {
    title: 'AI Cost Estimate Chat | Fixetta Richmond, VA',
    description: 'Chat with our AI to get accurate home repair cost estimates in Richmond, VA. Ask about plumbing, electrical, drywall, and more.',
    canonical: 'https://fixetta.ai/services/ai-cost-estimate-chat',
  },
  'how-to-use': {
    title: 'How to Use Fixetta | AI Home Repair Richmond, VA',
    description: 'Learn how to get instant AI home repair estimates in Richmond, VA. Upload photos, describe the issue, and book local contractors.',
    canonical: 'https://fixetta.ai/how-to-use',
  },
  about: {
    title: 'About Fixetta | Richmond VA Home Repair Platform',
    description: 'Fixetta connects Richmond, VA homeowners with trusted local contractors using AI-powered repair estimates.',
    canonical: 'https://fixetta.ai/about',
  },
  contact: {
    title: 'Contact Fixetta | Richmond VA Home Repair Help',
    description: 'Get in touch with Fixetta for home repair questions in Richmond, VA. We provide AI estimates and connect you with local pros.',
    canonical: 'https://fixetta.ai/contact',
  },
};

const DEFAULT_LOCATION = 'Richmond, VA';

/**
 * ServiceHub - Main screen integrating all components
 * Manages navigation between sections: hero, form, how-to-use, about, contact
 * Clean, minimal design with mobile-first responsive layout
 * 
 * Note: The AI Estimator is now integrated directly into the AIHero component.
 * Clicking "Try Snap AI" in the hero will expand the estimator inline instead
 * of navigating to a separate screen.
 * 
 * CRITICAL: Maintain all existing SEO metadata, Schema.org scripts, and header
 * hierarchies. Do not strip <meta> tags or alt attributes during this refactor.
 * Ensure all new routes follow the /services/[service-name] structure.
 */
export default function ServiceHub() {
  const [activeSection, setActiveSection] = useState('home'); // 'home' | 'form' | 'how-to-use' | 'about' | 'contact'
  const [formData, setFormData] = useState({
    description: '',
    category: '',
    name: '',
    email: '',
    phone: '',
    zip: '',
  });
  const [photos, setPhotos] = useState([]);
  const [submitResult, setSubmitResult] = useState(null);

  // ── SEO: Dynamic metadata based on active section ────────────────────────
  const seoConfig = useMemo(() => {
    const cfg = SEO_CONFIG[activeSection] || SEO_CONFIG.home;
    const schema = activeSection === 'home' ? null : buildServiceSchema({
      serviceName: cfg.title.split('|')[0].trim(),
      description: cfg.description,
      url: cfg.canonical,
      areaServed: 'Richmond, Virginia',
    });
    return { ...cfg, schema };
  }, [activeSection]);

  useSEO({
    title: seoConfig.title,
    description: seoConfig.description,
    canonical: seoConfig.canonical,
    schema: seoConfig.schema,
  });

  // ── Local Anchoring: Ensure Richmond, VA is in all headings ──────────────
  const getLocationTag = () => (
    <span className="location-tag" aria-label={`Serving ${DEFAULT_LOCATION}`}>
      Serving {DEFAULT_LOCATION}
    </span>
  );

  // Handle starting a text-based estimate - now opens chat
  const handleStartEstimate = useCallback(() => {
    setActiveSection('chat');
  }, []);

  // Handle hero CTA click - the estimator is now handled internally by AIHero
  const handleHeroCta = useCallback(() => {
    // AIHero handles its own estimator state now
    // This callback is kept for compatibility but no longer navigates to form
  }, []);

  // Handle submit - package data and send to console.log (placeholder for API)
  const handleSubmit = useCallback(async (payload) => {
    // Log the packaged request object (placeholder for OpenRouter API call)
    console.log('=== FIXETTA SUBMISSION PAYLOAD ===');
    console.log(JSON.stringify(payload, null, 2));
    console.log('==================================');

    setSubmitResult({
      success: true,
      message: 'Analysis submitted successfully!',
      payload,
      timestamp: new Date().toISOString(),
    });

    // Reset after showing result
    setTimeout(() => {
      setSubmitResult(null);
      setFormData({
        description: '',
        category: '',
        name: '',
        email: '',
        phone: '',
        zip: '',
      });
      setPhotos([]);
      setActiveSection('home');
    }, 3000);
  }, []);

  // Handle estimate complete callback from AIHero
  const handleEstimateComplete = useCallback((result) => {
    console.log('Estimate complete:', result);
    // You can handle the result here, e.g., save to history, show notification, etc.
  }, []);

  // Handle proceeding to booking/form after receiving AI estimate
  const handleProceedToBooking = useCallback((result) => {
    console.log('Proceeding to booking with estimate:', result);
    // Navigate to the chat section, pre-filling with estimate data if available
    if (result) {
      setFormData((prev) => ({
        ...prev,
        description: result.summary || prev.description,
      }));
    }
    setActiveSection('chat');
  }, []);

  // Render the appropriate section based on activeSection state
  const renderSection = () => {
    switch (activeSection) {
      case 'how-to-use':
        return <HowToUse />;
      case 'about':
        return <AboutUs />;
      case 'contact':
        return <ContactUs />;
      case 'chat':
        return (
          <div className="chat-flow">
            <AIChat 
              photos={photos}
              formData={formData}
              onSubmit={handleSubmit}
            />
          </div>
        );
      case 'home':
      default:
        return (
          <>
            <AIHero onEstimateComplete={handleEstimateComplete} onProceedToBooking={handleProceedToBooking} />
            <LandingContent onStartEstimate={handleStartEstimate} />
          </>
        );
    }
  };

  return (
    <div className="service-hub">
      {/* Header */}
      <Header 
        showBack={activeSection === 'chat'} 
        onBack={() => setActiveSection('home')}
        setActiveSection={setActiveSection}
      />

      {/* Success Toast */}
      {submitResult?.success && (
        <div className="success-toast" role="alert" aria-live="polite">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          <span>{submitResult.message}</span>
        </div>
      )}

      {/* Main Content */}
      <main className="service-hub-content">
        {renderSection()}
      </main>
    </div>
  );
}