import React, { useState, useEffect, useRef } from 'react';

// Screens
import HomeScreen from './screens/HomeScreen';
import ProsScreen from './screens/ProsScreen';
import ProjectsScreen from './screens/ProjectsScreen';
import ProfileScreen from './screens/ProfileScreen';

// Feature Components
import MultiPhotoCapture from './components/MultiPhotoCapture';
import AnalysisLoading from './components/AnalysisLoading';
import GuidedPrompts from './components/GuidedPrompts';
import AIResultScreen from './components/AIResultScreen';
import VitalsVault from './components/VitalsVault';

// New Silk Design Components
import Header from './components/Header';
import AIHero from './components/AIHero';
import ScopeInputs from './components/ScopeInputs';
import ActionButton from './components/ActionButton';

// Utilities
import { packageSubmissionRequest, validateSubmission } from './utils/validator';
import { ENDPOINTS, APP_CONFIG } from './config';

export default function App() {
  const [flow, setFlow] = useState('home'); // current screen
  const [photos, setPhotos] = useState([]); // captured photos
  const [analysis, setAnalysis] = useState(null); // AI analysis result
  const [answers, setAnswers] = useState([]); // guided prompt answers
  const [toast, setToast] = useState(null);
  const [zip, setZip] = useState('23219'); // Default zip for rates
  
  // New Silk submission flow state
  const [formData, setFormData] = useState(null); // Form data from ScopeInputs
  const [isSubmitting, setIsSubmitting] = useState(false); // Submission loading state
  const [submissionError, setSubmissionError] = useState(null); // Submission error

  // Navigate to a main screen
  const navigate = (screen) => {
    setFlow(screen);
    window.scrollTo(0, 0);
  };

  // Handle capture complete → go to loading
  const handleCaptureComplete = (capturedPhotos, categoryKey) => {
    setPhotos(capturedPhotos);
    import('./data/mockData.js').then(mod => {
      const AI_ANALYSES = mod.AI_ANALYSES;
      const data = AI_ANALYSES[categoryKey] || AI_ANALYSES.default;
      setAnalysis(data);
      setFlow('loading');
    }).catch(err => {
      console.error(err);
      setFlow('loading');
    });
  };

  // Loading complete → go to guided prompts or result
  const handleLoadingComplete = () => {
    if (analysis && analysis.questions && analysis.questions.length > 0) {
      setFlow('prompts');
    } else {
      setFlow('result');
    }
  };

  // Prompts complete → go to result
  const handlePromptsComplete = (promptAnswers) => {
    setAnswers(promptAnswers);
    setFlow('result');
  };

  // Home vitals vault navigation
  const handleVitalsNext = () => {
    setFlow('home');
  };

  // ===== SILK SUBMISSION FLOW HANDLERS =====
  
  // Handle form data submission from ScopeInputs
  const handleFormSubmit = (data) => {
    setFormData(data);
    setToast('Information saved. Ready to submit!');
  };

  // Handle form validation errors
  const handleFormError = (errors) => {
    setSubmissionError(errors);
    setToast('Please fix the errors above');
  };

  // Handle ActionButton click - submit to AI backend
  const handleSubmission = async (requestPayload) => {
    setIsSubmitting(true);
    setSubmissionError(null);
    
    try {
      // Package the request with photos
      const packagedRequest = packageSubmissionRequest(
        { ...formData, ...requestPayload.scope, ...requestPayload.contact },
        photos
      );

      // Log the packaged request for debugging (remove in production)
      console.log('Packaged submission request:', JSON.stringify(packagedRequest, null, 2));

      // Simulate API call to OpenRouter backend
      // In production, this would be:
      // const response = await fetch(ENDPOINTS.ANALYZE, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(packagedRequest),
      // });
      // const data = await response.json();
      
      // For now, simulate the flow with mock data
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Get analysis from mock data based on category
      import('./data/mockData.js').then(mod => {
        const AI_ANALYSES = mod.AI_ANALYSES;
        const category = formData?.category || 'default';
        const analysisData = AI_ANALYSES[category] || AI_ANALYSES.default;
        setAnalysis(analysisData);
        setFlow('loading');
      }).catch(err => {
        console.error('Failed to load mock data:', err);
        setToast('Analysis failed. Please try again.');
        setIsSubmitting(false);
      });
      
    } catch (error) {
      console.error('Submission error:', error);
      setSubmissionError(error.message);
      setToast('Submission failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Nav items
  const navItems = [
    { id: 'home', icon: '🏠', label: 'Home' },
    { id: 'projects', icon: '📁', label: 'Projects' },
    { id: 'camera', icon: null, label: 'Snap' },
    { id: 'pros', icon: '👷', label: 'Pros' },
    { id: 'profile', icon: '👤', label: 'Profile' },
  ];

  // Bottom nav is only shown on main screens
  const showBottomNav = ['home', 'projects', 'pros', 'profile'].includes(flow);
  const isActive = (id) => flow === id || (flow === 'result' && id === 'home');

  return (
    <div className="app-shell">
      {/* Toast Notification */}
      {toast && (
        <div className="toast" onClick={() => setToast(null)}>
          {toast}
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="main-content">
        {flow === 'home' && (
          <HomeScreen
            navigate={navigate}
            setAnalysis={setAnalysis}
            setPhotos={setPhotos}
          />
        )}

        {flow === 'camera' && (
          <MultiPhotoCapture
            onComplete={handleCaptureComplete}
            navigate={navigate}
          />
        )}

        {flow === 'loading' && (
          <AnalysisLoading
            photos={photos}
            onComplete={handleLoadingComplete}
          />
        )}

        {flow === 'prompts' && analysis && (
          <GuidedPrompts
            questions={analysis.questions}
            analysis={analysis}
            onComplete={handlePromptsComplete}
            navigate={navigate}
          />
        )}

        {flow === 'result' && analysis && (
          <AIResultScreen
            analysis={analysis}
            photos={photos}
            answers={answers}
            navigate={navigate}
            zip={zip}
          />
        )}

        {flow === 'vitals' && (
          <VitalsVault
            navigate={navigate}
            onNext={handleVitalsNext}
          />
        )}

        {flow === 'pros' && <ProsScreen navigate={navigate} analysis={analysis} />}
        {flow === 'projects' && <ProjectsScreen navigate={navigate} />}
        {flow === 'profile' && <ProfileScreen navigate={navigate} />}
      </main>

      {/* BOTTOM NAV */}
      {showBottomNav && (
        <nav className="bottom-nav">
          {navItems.map(item => {
            if (item.id === 'camera') {
              return (
                <div key="camera" className="bnav-item bnav-snap" onClick={() => navigate('camera')}>
                  <div className="bnav-snap-btn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                  </div>
                </div>
              );
            }
            return (
              <div key={item.id} className={`bnav-item ${isActive(item.id) ? 'active' : ''}`} onClick={() => navigate(item.id)}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span style={{ fontSize: 10, marginTop: 2, fontWeight: isActive(item.id) ? 700 : 500 }}>{item.label}</span>
              </div>
            );
          })}
        </nav>
      )}
    </div>
  );
}
