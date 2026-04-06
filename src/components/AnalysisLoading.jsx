
import React, { useState, useEffect } from 'react';
import './AnalysisLoading.css';

const STEPS = [
  { icon: '📤', label: 'Uploading images…', detail: 'Securing to encrypted cloud' },
  { icon: '🔍', label: 'Detecting objects…', detail: 'Identifying damage patterns' },
  { icon: '🧠', label: 'Analyzing with AI…', detail: 'Cross-referencing 12k repair records' },
  { icon: '💰', label: 'Estimating cost…', detail: 'Checking local material prices' },
  { icon: '👷', label: 'Matching pros…', detail: 'Finding available specialists' },
];

export default function AnalysisLoading({ photos, category, onComplete }) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let p = 0;
    let step = 0;
    const totalDuration = photos.length > 0 ? 3500 : 1800;
    const interval = 50;
    const increment = 100 / (totalDuration / interval);

    const timer = setInterval(() => {
      p += increment + (Math.random() * 2 - 1);
      step = Math.min(Math.floor(p / 20), STEPS.length - 1);
      
      if (p >= 100) {
        clearInterval(timer);
        setDone(true);
        setTimeout(() => onComplete(), 400);
        return;
      }
      
      setProgress(Math.min(p, 100));
      setCurrentStep(step);
    }, interval);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="analysis-loading">
      {/* PHOTOS PREVIEW */}
      {photos.length > 0 && (
        <div className="analysis-photos">
          {photos.slice(0, 3).map((photo, i) => (
            <div key={i} className="analysis-photo-thumb" style={{ zIndex: 3 - i, transform: `scale(${1 - i * 0.08}) translateY(${i * 4}px)` }}>
              <img src={photo.url} alt="" />
            </div>
          ))}
          {photos.length > 3 && (
            <div className="analysis-photo-count" style={{ zIndex: 0 }}>+{photos.length - 3}</div>
          )}
        </div>
      )}

      {photos.length === 0 && (
        <div className="analysis-icon-demo">
          <span style={{ fontSize: 48 }}>🔍</span>
        </div>
      )}

      {/* PROGRESS RING */}
      <div className="progress-ring-wrap">
        <svg viewBox="0 0 100 100" className="progress-ring-svg">
          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="var(--teal)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 42}`}
            strokeDashoffset={`${2 * Math.PI * 42 * (1 - progress / 100)}`}
            transform="rotate(-90 50 50)"
            style={{ transition: 'stroke-dashoffset 0.3s ease' }}
          />
        </svg>
        <div className="progress-ring-text">
          <div className="progress-pct">{Math.round(progress)}%</div>
        </div>
      </div>

      {/* TITLE */}
      <div style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 800, color: 'white', marginBottom: 6, textAlign: 'center' }}>
        {done ? 'Analysis Complete!' : 'Snap AI Analyzing…'}
      </div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 32, textAlign: 'center' }}>
        {STEPS[currentStep].detail}
      </div>

      {/* STEPS */}
      <div style={{ width: '100%', maxWidth: 320 }}>
        {STEPS.map((step, i) => (
          <div
            key={i}
            className="analysis-step"
            style={{
              opacity: i <= currentStep ? 1 : 0.3,
              transition: 'opacity 0.3s',
            }}
          >
            <span style={{ fontSize: 16 }}>{step.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: i <= currentStep ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)' }}>
                {step.label}
              </div>
              {i === currentStep && (
                <div className="step-spinner" />
              )}
            </div>
            <div style={{ marginLeft: 'auto' }}>
              {i < currentStep ? (
                <span style={{ color: 'var(--teal)', fontWeight: 700 }}>✓</span>
              ) : i === currentStep && done ? (
                <span style={{ color: 'var(--teal)', fontWeight: 700 }}>✓</span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
