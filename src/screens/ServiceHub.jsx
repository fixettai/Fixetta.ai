import React, { useState, useCallback } from 'react';
import Header from '../components/Header';
import AIHero from '../components/AIHero';
import ScopeInputs from '../components/ScopeInputs';
import ActionButton from '../components/ActionButton';
import LandingContent from '../components/LandingContent';
import HowToUse from '../components/HowToUse';
import AboutUs from '../components/AboutUs';
import ContactUs from '../components/ContactUs';
import './ServiceHub.css';

/**
 * ServiceHub - Main screen integrating all components
 * Manages navigation between sections: hero, form, how-to-use, about, contact
 * Clean, minimal design with mobile-first responsive layout
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitResult, setSubmitResult] = useState(null);

  // Handle starting an estimate from landing content
  const handleStartEstimate = useCallback(() => {
    setActiveSection('form');
  }, []);

  // Handle hero CTA click - transition to form
  const handleHeroCta = useCallback(() => {
    setActiveSection('form');
  }, []);

  // Handle form data changes
  const handleFormChange = useCallback((data) => {
    setFormData((prev) => ({ ...prev, ...data }));
  }, []);

  // Handle form errors
  const handleFormError = useCallback((errs) => {
    setErrors(errs);
  }, []);

  // Handle submit - package data and send to console.log (placeholder for API)
  const handleSubmit = useCallback(async (payload) => {
    setIsSubmitting(true);
    setErrors({});

    try {
      // Validate required fields before submission
      if (!payload.scope.description || payload.scope.description.length < 10) {
        setErrors({ description: 'Please describe the issue in at least 10 characters' });
        setIsSubmitting(false);
        return;
      }

      if (!payload.scope.category) {
        setErrors({ category: 'Please select a service category' });
        setIsSubmitting(false);
        return;
      }

      // Log the packaged request object (placeholder for OpenRouter API call)
      console.log('=== FIXETTA SUBMISSION PAYLOAD ===');
      console.log(JSON.stringify(payload, null, 2));
      console.log('==================================');

      // Simulate API delay for UX
      await new Promise((resolve) => setTimeout(resolve, 1500));

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
        setActiveSection('home');
      }, 3000);

    } catch (error) {
      setErrors({ submit: 'Submission failed. Please try again.' });
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // Check if form has valid data to enable submit
  const canSubmit = formData.description.length >= 10 && formData.category.length > 0;

  // Render the appropriate section based on activeSection state
  const renderSection = () => {
    switch (activeSection) {
      case 'how-to-use':
        return <HowToUse />;
      case 'about':
        return <AboutUs />;
      case 'contact':
        return <ContactUs />;
      case 'form':
        return (
          <div className="form-flow">
            <ScopeInputs 
              initialData={formData}
              onChange={handleFormChange}
              onError={handleFormError}
            />
            {errors.description && (
              <div className="submit-error" role="alert">{errors.description}</div>
            )}
            {errors.category && (
              <div className="submit-error" role="alert">{errors.category}</div>
            )}
            {errors.submit && (
              <div className="submit-error" role="alert">{errors.submit}</div>
            )}
            <ActionButton
              label="Get Estimate"
              loadingLabel="Analyzing..."
              onSubmit={handleSubmit}
              isLoading={isSubmitting}
              isDisabled={!canSubmit}
              formData={formData}
            />
          </div>
        );
      case 'home':
      default:
        return (
          <>
            <AIHero onCtaClick={handleHeroCta} />
            <LandingContent onStartEstimate={handleStartEstimate} />
          </>
        );
    }
  };

  return (
    <div className="service-hub">
      {/* Header */}
      <Header 
        showBack={activeSection === 'form'} 
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