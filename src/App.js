
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

export default function App() {
  const [flow, setFlow] = useState('home'); // current screen
  const [photos, setPhotos] = useState([]); // captured photos
  const [analysis, setAnalysis] = useState(null); // AI analysis result
  const [answers, setAnswers] = useState([]); // guided prompt answers
  const [toast, setToast] = useState(null);
  const [zip, setZip] = useState('23219'); // Default zip for rates

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
