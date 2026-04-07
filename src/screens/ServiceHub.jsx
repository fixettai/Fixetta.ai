import React, { useState, useCallback } from 'react';
import Header from '../components/Header';
import AIHero from '../components/AIHero';
import AIChat from '../components/AIChat';
import LandingContent from '../components/LandingContent';
import HowToUse from '../components/HowToUse';
import AboutUs from '../components/AboutUs';
import ContactUs from '../components/ContactUs';
import './ServiceHub.css';

/**
 * ServiceHub - Main screen integrating all components
 * Manages navigation between sections: hero, form, how-to-use, about, contact
 * Clean, minimal design with mobile-first responsive layout
 * 
 * Note: The AI Estimator is now integrated directly into the AIHero component.
 * Clicking "Try Snap AI" in the hero will expand the estimator inline instead
 * of navigating to a separate screen.
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