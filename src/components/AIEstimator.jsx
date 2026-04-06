/**
 * AIEstimator Component - Photo upload and AI-powered estimation
 * Integrates with EstimatorService for multi-model pipeline
 * Mobile-first, responsive design with loading states
 */
import React, { useState, useRef, useCallback } from 'react';
import './AIEstimator.css';
import { runEstimatorPipeline, generateTextEstimate, getFallbackEstimate } from '../services/EstimatorService';

export default function AIEstimator({ onBack }) {
  const [photos, setPhotos] = useState([]);
  const [userNote, setUserNote] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
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

  // Handle analyze button click
  const handleAnalyze = useCallback(async () => {
    if (photos.length === 0 && !userNote.trim()) {
      setError('Please upload at least one photo or describe the issue.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      let estimatorResult;

      if (photos.length > 0) {
        // Full pipeline with images
        const files = photos.map((p) => p.file);
        estimatorResult = await runEstimatorPipeline(files, userNote.trim());
      } else {
        // Text-only estimation using AI
        estimatorResult = await generateTextEstimate(userNote.trim());
      }

      setResult(estimatorResult);
    } catch (err) {
      console.error('[AIEstimator] Analysis failed:', err);
      setError(err.message || 'Analysis failed. Please try again.');

      // Fallback on error
      setResult(getFallbackEstimate());
    } finally {
      setIsAnalyzing(false);
    }
  }, [photos, userNote]);

  // Handle new estimate (reset state)
  const handleNewEstimate = useCallback(() => {
    photos.forEach((p) => URL.revokeObjectURL(p.url));
    setPhotos([]);
    setUserNote('');
    setResult(null);
    setError(null);
  }, [photos]);

  // ── Loading State ─────────────────────────────────────────────────────
  if (isAnalyzing) {
    const hasPhotos = photos.length > 0;
    return (
      <div className="ai-estimator-container">
        <div className="analyzing-state">
          <div className="analyzing-animation">
            <div className="pulse-ring" />
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
          <h3 className="analyzing-title">{hasPhotos ? 'Analyzing Your Space' : 'Analyzing Your Description'}</h3>
          <p className="analyzing-subtitle">
            {hasPhotos
              ? 'AI is identifying damage, measuring dimensions, and generating estimates...'
              : 'AI is generating a professional scope of work and cost estimate...'}
          </p>
          <div className="analyzing-steps">
            {hasPhotos ? (
              <>
                <div className="step-item active">
                  <span className="step-dot" />
                  <span>Visual Analysis (Gemini)</span>
                </div>
                <div className="step-item pending">
                  <span className="step-dot" />
                  <span>Scope Generation (Claude)</span>
                </div>
                <div className="step-item pending">
                  <span className="step-dot" />
                  <span>Cost Estimation</span>
                </div>
              </>
            ) : (
              <>
                <div className="step-item active">
                  <span className="step-dot" />
                  <span>Generating Scope (Claude)</span>
                </div>
                <div className="step-item pending">
                  <span className="step-dot" />
                  <span>Cost Estimation</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Result State ──────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="ai-estimator-container">
        <div className="result-state">
          {/* Header */}
          <div className="result-header">
            <button className="back-btn" onClick={handleNewEstimate}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <h2 className="result-title">AI Estimate</h2>
            <div className="result-spacer" />
          </div>

          {/* Detected Items */}
          <div className="result-section">
            <h3 className="section-title">Detected Issues</h3>
            <div className="detected-items-grid">
              {result.detected_items.map((item, i) => (
                <div key={i} className="detected-item-chip">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            {result.estimated_sqft > 0 && (
              <div className="sqft-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" /></svg>
                Estimated Area: {result.estimated_sqft} sq ft
              </div>
            )}
          </div>

          {/* Itemized Tasks */}
          <div className="result-section">
            <h3 className="section-title">Scope of Work</h3>
            <div className="task-list">
              {result.itemized_tasks.map((task, i) => (
                <div key={i} className="task-card">
                  <div className="task-header">
                    <span className="task-number">{i + 1}</span>
                    <span className="task-name">{task.task}</span>
                  </div>
                  {task.materials.length > 0 && (
                    <div className="task-materials">
                      <span className="materials-label">Materials:</span>
                      <div className="materials-list">
                        {task.materials.map((mat, j) => (
                          <span key={j} className="material-chip">{mat}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="task-cost">
                    ${task.estimated_cost.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total Cost */}
          <div className="result-section total-section">
            <div className="total-row">
              <span className="total-label">Estimated Total</span>
              <span className="total-value">${result.estimated_cost.toLocaleString()}</span>
            </div>
            <p className="disclaimer">
              * This is an AI-generated estimate. Actual costs may vary based on location, materials, and contractor rates. We recommend getting multiple quotes.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="result-actions">
            <button className="btn-primary" onClick={() => {
              // Placeholder: Navigate to booking or pros
              alert('Booking feature coming soon!');
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
              Find Local Pros
            </button>
            <button className="btn-secondary" onClick={handleNewEstimate}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
              New Estimate
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Upload State ──────────────────────────────────────────────────────
  return (
    <div className="ai-estimator-container">
      {/* Header */}
      <div className="estimator-header">
        {onBack && (
          <button className="back-btn" onClick={onBack}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
        )}
        <h2 className="estimator-title">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          AI Estimator
        </h2>
        <div className="estimator-spacer" />
      </div>

      {/* Instructions */}
      <div className="estimator-instructions">
        <p>Upload photos of the area that needs repair. Our AI will analyze the damage and generate an itemized cost estimate.</p>
      </div>

      {/* Photo Upload Area */}
      <div className="photo-upload-section">
        <div className="photo-grid">
          {/* Display existing photos */}
          {photos.map((photo, index) => (
            <div key={index} className="photo-thumbnail">
              <img src={photo.url} alt={`Upload ${index + 1}`} />
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

          {/* Add more slots */}
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

      {/* Quick Demo Options */}
      <div className="demo-options">
        <span className="demo-label">Or try a quick demo:</span>
        <div className="demo-tiles">
          <button className="demo-tile" onClick={() => {
            setUserNote('Cracked drywall near ceiling, water damage from upstairs bathroom leak, approximately 4x3 ft area');
          }}>
            <span>💧</span>
            <span>Water Damage</span>
          </button>
          <button className="demo-tile" onClick={() => {
            setUserNote('Hole in drywall from door handle, approximately 6 inch diameter, needs patch and paint');
          }}>
            <span>🔨</span>
            <span>Hole Repair</span>
          </button>
          <button className="demo-tile" onClick={() => {
            setUserNote('Electrical outlet sparking when plugging in devices, may need replacement');
          }}>
            <span>⚡</span>
            <span>Electrical</span>
          </button>
        </div>
      </div>
    </div>
  );
}