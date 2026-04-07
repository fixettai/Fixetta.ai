import React, { useState, useRef, useCallback, useEffect } from 'react';
import './AIHero.css';
import { runEstimatorPipeline, generateTextEstimate, getFallbackEstimate } from '../services/EstimatorService';
import { APP_CONFIG } from '../config';

/**
 * AIHero Component - Clean minimal hero banner for the AI feature
 * Mobile-first, 44x44px minimum touch targets, 12px border radius
 * Clean, minimal aesthetic with no decorative clutter
 *
 * CRITICAL: Maintain all existing SEO metadata, Schema.org scripts, and header
 * hierarchies. Do not strip <meta> tags or alt attributes during this refactor.
 * Ensure all images have descriptive alt text with Richmond, VA context.
 *
 * Now integrates the AI Estimator functionality inline when activated.
 */
export default function AIHero({
  title,
  subtitle,
  ctaText = 'Try Snap AI',
  onEstimateComplete,
  onProceedToBooking
}) {
  // SEO defaults with Richmond, VA local anchoring
  const defaultProps = {
    title: title || `AI Home Repair Estimate in ${APP_CONFIG.DEFAULT_LOCATION}`,
    subtitle: subtitle || 'Upload a photo or describe the issue. Get an instant AI-powered cost estimate for your Richmond, VA home.',
  };
  const [isEstimating, setIsEstimating] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [userNote, setUserNote] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeZone, setActiveZone] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const fileRef = useRef(null);

  const MAX_PHOTOS = 4;

  // Handle file selection
  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newPhotos = [];
    const currentCount = photos.length;

    files.forEach((file) => {
      if (currentCount + newPhotos.length < MAX_PHOTOS && file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        newPhotos.push({ url, file, name: file.name });
      }
    });

    if (newPhotos.length > 0) {
      setPhotos((prev) => [...prev, ...newPhotos].slice(0, MAX_PHOTOS));
      setError(null);
    }
  }, [photos.length]);

  // Handle photo removal
  const handleRemovePhoto = useCallback((index) => {
    setPhotos((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].url);
      updated.splice(index, 1);
      return updated;
    });
  }, []);

  // Handle CTA click - toggle estimator view
  const handleCtaClick = useCallback(() => {
    if (isEstimating) {
      // If already estimating, reset the form
      handleNewEstimate();
    } else {
      setIsEstimating(true);
    }
  }, [isEstimating]);

  // Handle analyze button click
  const handleAnalyze = useCallback(async () => {
    if (photos.length === 0 && !userNote.trim()) {
      setError('Please upload at least one photo or describe the issue.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setActiveZone(null);

    try {
      let estimatorResult;

      if (photos.length > 0) {
        const files = photos.map((p) => p.file);
        estimatorResult = await runEstimatorPipeline(files, userNote.trim());
      } else {
        estimatorResult = await generateTextEstimate(userNote.trim());
      }

      setResult(estimatorResult);
      if (onEstimateComplete) {
        onEstimateComplete(estimatorResult);
      }
    } catch (err) {
      console.error('[AIHero] Analysis failed:', err);
      setError(err.message || 'Analysis failed. Please try again.');
      setResult(getFallbackEstimate());
    } finally {
      setIsAnalyzing(false);
    }
  }, [photos, userNote, onEstimateComplete]);

  // Handle new estimate (reset state)
  const handleNewEstimate = useCallback(() => {
    photos.forEach((p) => URL.revokeObjectURL(p.url));
    setPhotos([]);
    setUserNote('');
    setResult(null);
    setError(null);
    setActiveZone(null);
    setIsEstimating(false);
  }, [photos]);

  // Cycle through analysis steps for a smooth "black box" experience
  useEffect(() => {
    if (!isAnalyzing) {
      setCurrentStep(0);
      return;
    }

    const stepsCount = 3;
    const intervalMs = 2500;
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev < stepsCount - 1 ? prev + 1 : prev));
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isAnalyzing]);

  // ── Loading State ─────────────────────────────────────────────────────
  if (isAnalyzing) {
    const analysisSteps = [
      'Analyzing your photo...',
      'Estimating scope of work...',
      'Estimate ready!',
    ];

    return (
      <section className="ai-hero ai-hero-estimating" aria-label="AI Home Repair Estimator">
        <div className="analyzing-state">
          <div className="analyzing-animation">
            <div className="pulse-ring" />
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
           <h2 className="analyzing-title analyzing-title-fade">
             {analysisSteps[currentStep]}
           </h2>
           <p className="analyzing-subtitle analyzing-subtitle-fade">
            {currentStep === 0 && 'Identifying damage and reference points...'}
            {currentStep === 1 && 'Calculating materials, labor, and regional pricing...'}
            {currentStep === 2 && 'Finalizing your visual estimate...'}
          </p>
          <div className="analyzing-steps">
            {analysisSteps.map((step, index) => (
              <div
                key={step}
                className={`step-item ${
                  index === currentStep ? 'active' : index < currentStep ? 'complete' : 'pending'
                }`}
              >
                <span className="step-dot" />
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ── Result State ──────────────────────────────────────────────────────
  if (result && isEstimating) {
    const primaryPhoto = photos.length > 0 ? photos[0].url : null;
    const summary = result.estimate_summary;
    const zones = result.repair_zones || [];

    return (
      <section className="ai-hero ai-hero-estimating ai-hero-result" aria-label="AI Home Repair Estimator">
         <div className="result-header">
           <button className="result-back-btn" onClick={handleNewEstimate} aria-label="Back to hero">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
               <polyline points="15 18 9 12 15 6" />
             </svg>
           </button>
           <h2 className="result-title">AI Cost Estimate Complete – {APP_CONFIG.DEFAULT_LOCATION}</h2>
          <div className="result-spacer" />
          <span className="result-badge">AI Estimator</span>
        </div>

        <div className="result-content">
           {/* Hero Image with Hotspots */}
           {primaryPhoto && (
             <div className="hero-image-container">
               <div className="hero-image-wrapper">
                 <img src={primaryPhoto} alt={`AI home repair analysis showing damage zones in ${APP_CONFIG.DEFAULT_LOCATION}`} className="hero-image" />
                {zones.map((zone) => (
                  <button
                    key={zone.zone_id}
                    className={`hotspot-marker ${activeZone === zone.zone_id ? 'active' : ''}`}
                    style={{
                      left: `${zone.coordinates.x}%`,
                      top: `${zone.coordinates.y}%`,
                    }}
                    onClick={() => setActiveZone(activeZone === zone.zone_id ? null : zone.zone_id)}
                  >
                    <span className="hotspot-number">{zone.indicator_number}</span>
                  </button>
                ))}
              </div>
            </div>
           )}

           {/* Total Estimate Summary */}
           <div className="total-summary-card">
             <div className="total-summary-header">
               <h3 className="total-summary-label">{summary?.summary_label || `${APP_CONFIG.DEFAULT_LOCATION} Home Repair Estimate`}</h3>
              {summary?.confidence && (
                <span className={`confidence-badge ${summary.confidence}`}>
                  {summary.confidence.charAt(0).toUpperCase() + summary.confidence.slice(1)} Confidence
                </span>
              )}
            </div>
            <div className="total-price-display">
              <span className="total-price-label">Total Estimate</span>
              <span className="total-price-value">${summary?.total_price?.toLocaleString() || '0'}</span>
            </div>
            <div className="price-range-display">
              <span>Range: ${summary?.price_range_low?.toLocaleString() || '0'} - ${summary?.price_range_high?.toLocaleString() || '0'}</span>
            </div>
          </div>

           {/* Repair Zone Cards */}
           {zones.length > 0 && (
             <div className="repair-zones-section">
               <h2 className="section-title">Detected Repair Zones – {APP_CONFIG.DEFAULT_LOCATION}</h2>
              <div className="zone-cards-container">
                {zones.map((zone) => (
                  <div
                    key={zone.zone_id}
                    className={`zone-card ${activeZone === zone.zone_id ? 'active' : ''}`}
                    onClick={() => setActiveZone(activeZone === zone.zone_id ? null : zone.zone_id)}
                  >
                    <div className="zone-card-header">
                      <div className="zone-indicator">
                        <span className="zone-number">{zone.indicator_number}</span>
                      </div>
                      <div className="zone-title-area">
                        <h4 className="zone-title">{zone.title}</h4>
                        <span className={`severity-badge ${zone.severity}`}>{zone.severity}</span>
                      </div>
                      <div className="zone-price">${zone.zone_price?.toLocaleString()}</div>
                    </div>
                    {activeZone === zone.zone_id && (
                      <div className="zone-card-details">
                        <p className="zone-description">{zone.description}</p>
                        <div className="zone-repair-steps">
                          <h5>Repair Steps:</h5>
                          <ol>
                            {zone.repair_steps?.map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ol>
                        </div>
                        <div className="zone-price-range">
                          <span>Price Range: ${zone.price_range_low?.toLocaleString()} - ${zone.price_range_high?.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA Button */}
          <div className="result-actions">
            <button className="btn-primary" onClick={() => onProceedToBooking && onProceedToBooking(result)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
              {result.ui_guidance?.cta_label || 'Confirm your details!'}
            </button>
            <button className="btn-secondary" onClick={handleNewEstimate}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
              New Estimate
            </button>
          </div>
        </div>
      </section>
    );
  }

  // ── Estimator Input State ─────────────────────────────────────────────
  if (isEstimating) {
    return (
      <section className="ai-hero ai-hero-estimating" aria-label="AI Home Repair Estimator">
        <div className="estimator-header">
          <button className="estimator-back-btn" onClick={handleNewEstimate} aria-label="Back to hero">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h2 className="estimator-title">AI Photo Estimate – {APP_CONFIG.DEFAULT_LOCATION}</h2>
          <div className="estimator-spacer" />
          <span className="estimator-badge-inline">Snap AI</span>
        </div>

        {/* Instructions */}
        <div className="estimator-instructions">
          <p>Upload photos, get your estimate.</p>
        </div>

        {/* Photo Upload Area */}
        <div className="photo-upload-section">
        <div className="photo-grid">
          {photos.map((photo, index) => (
            <div key={index} className="photo-thumbnail">
              <img src={photo.url} alt={`Home repair photo for AI analysis in ${APP_CONFIG.DEFAULT_LOCATION} - photo ${index + 1}`} />
                <button
                  className="remove-photo-btn"
                  onClick={() => handleRemovePhoto(index)}
                  aria-label={`Remove photo ${index + 1}`}
                >
                  ×
                </button>
                <span className="photo-index">{index + 1}</span>
              </div>
            ))}

            {photos.length < MAX_PHOTOS && (
              <button
                className="photo-add-slot"
                onClick={() => fileRef.current?.click()}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Add Photo</span>
              </button>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden-input"
            onChange={handleFileSelect}
          />

          {photos.length < MAX_PHOTOS && (
            <button className="camera-btn" onClick={() => fileRef.current?.click()}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Camera / Gallery
            </button>
          )}
        </div>

        {/* User Note */}
        <div className="note-section">
          <label htmlFor="user-note" className="note-label">
            Describe the issue (optional):
          </label>
          <textarea
            id="user-note"
            className="user-note-input"
            value={userNote}
            onChange={(e) => setUserNote(e.target.value)}
            placeholder="E.g., 'Water damage from leaky pipe, approximately 3x3 ft area near outlet...'"
            maxLength={500}
            rows={3}
          />
          <span className="char-count">{userNote.length}/500</span>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message" role="alert">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p>{error}</p>
          </div>
        )}

        {/* Analyze Button */}
        <button
          className="analyze-btn"
          onClick={handleAnalyze}
          disabled={photos.length === 0 && !userNote.trim()}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          {photos.length > 0 ? `Analyze ${photos.length} Photo${photos.length > 1 ? 's' : ''}` : 'Analyze Description'}
        </button>

      </section>
    );
  }

  // ── Default Hero State ────────────────────────────────────────────────
  return (
    <section className="ai-hero" aria-label={`AI Home Repair Estimator in ${APP_CONFIG.DEFAULT_LOCATION}`}>
      <div className="hero-content">
        {/* Main heading (H1 - one per page, includes Richmond, VA) */}
        <h1 className="hero-heading">
          {defaultProps.title}
        </h1>

        {/* Subtitle with local anchoring */}
        <p className="hero-subtitle">{defaultProps.subtitle}</p>
        
        {/* CTA Button */}
        <button 
          className="hero-cta-btn" 
          onClick={handleCtaClick}
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