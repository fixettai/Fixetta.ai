
import React, { useState, useEffect } from 'react';
import './AIResultScreen.css';
import BoundingOverlay from './BoundingOverlay';
import { storage } from '../utils/aiPipeline';
import { matchProsToEstimate } from '../utils/aiPipeline';
import { PROS, AI_ANALYSES } from '../data/mockData';

export default function AIResultScreen({ analysis, photos, answers, navigate, zip }) {
  const [showSheet, setShowSheet] = useState(false);
  const [showBounding, setShowBounding] = useState(false);
  const [booked, setBooked] = useState(false);
  const [selectedPro, setSelectedPro] = useState(null);
  const [localizedCost, setLocalizedCost] = useState(analysis.cost);
  const [savedResult, setSavedResult] = useState(false);
  const [analysisData, setAnalysisData] = useState(analysis);
  const [boundingBoxes, setBoundingBoxes] = useState([]);

  useEffect(() => {
    // Load from storage if needed
    const savedVitals = storage.get('vitals');
    console.log('Vitals:', savedVitals);

    // Animate bounding boxes after load
    const timer = setTimeout(() => {
      import('../utils/aiPipeline').then(({ generateBoundingBoxes }) => {
        setBoundingBoxes(generateBoundingBoxes(analysisData.category.toLowerCase()) || []);
      });
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const cc = analysisData.complexityColor || '#10b981';
  const cb = complexityBg(analysisData.complexity);

  // Confidence-based UI
  const needsHumanReview = analysisData.confidence < 75;

  // Matched pros for this estimate
  const matchedPros = matchProsToEstimate(analysisData.category, PROS);

  function complexityBg(c) {
    if (c === 'Low') return '#dcfce7';
    if (c === 'Medium') return '#fef9c3';
    if (c === 'High') return '#fee2e2';
    return '#dcfce7';
  }

  const handleBook = (pro) => {
    setSelectedPro(pro);
    setShowSheet(false);
    setBooked(true);
  };

  // Save result
  const handleSaveResult = () => {
    setSavedResult(true);
    const results = storage.get('results') || [];
    results.push({
      ...analysisData,
      photos: photos.map(p => p.url),
      answers,
      savedAt: new Date().toISOString(),
    });
    storage.set('results', results);
    setTimeout(() => setSavedResult(false), 1500);
  };

  // Booked screen
  if (booked && selectedPro) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--gray-l)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, paddingBottom: 80 }}>
        <div className="success-ring anim-bounce-in" style={{ width: 96, height: 96, borderRadius: '50%', background: 'var(--teal-xl)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>
          ✅
        </div>
        <div style={{ fontFamily: 'Syne', fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Booking Confirmed!</div>
        <div style={{ fontSize: 15, color: 'var(--gray)', marginBottom: 24, lineHeight: 1.6, textAlign: 'center' }}>
          {selectedPro.name} will arrive <strong style={{ color: selectedPro.avail.includes('Today') ? '#10b981' : 'var(--orange)' }}>{selectedPro.avail}</strong>
        </div>
        <div style={{ background: 'white', borderRadius: 20, padding: '20px', marginBottom: 24, width: '100%', maxWidth: 360 }}>
          <div style={{ fontFamily: 'Syne', fontSize: 14, fontWeight: 700, color: 'var(--gray)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 }}>Booking Summary</div>
          {[
            { l: 'Job', v: analysisData.job },
            { l: 'Pro', v: selectedPro.name },
            { l: 'Arriving', v: selectedPro.avail },
            { l: 'Est. Cost', v: localizedCost },
            { l: 'Duration', v: analysisData.laborHours + ' hrs' },
          ].map(r => (
            <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 14, color: 'var(--gray)' }}>{r.l}</span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{r.v}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 360 }}>
          <button className="btn btn-primary btn-full" onClick={() => navigate('projects')}>View My Projects</button>
          <button className="btn btn-ghost btn-full" onClick={() => { setBooked(false); navigate('home'); }}>Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="result-screen" style={{ paddingBottom: 80 }}>
      {/* TOP NAV */}
      <div className="top-nav">
        <button className="top-nav-back" onClick={() => navigate('camera')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 800 }}>AI Estimate</div>
        <button className="top-nav-back" onClick={handleSaveResult} style={{ background: savedResult ? 'var(--teal)' : 'var(--gray-l)' }} title="Save">
          {savedResult ? '✓' : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--dark)" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          )}
        </button>
      </div>

      {/* PHOTO AREA */}
      <div className="result-photo-area" onClick={() => setShowBounding(!showBounding)}>
        {photos.length > 0 ? (
          <img src={photos[0].url} alt="Captured issue" className="result-img" />
        ) : (
          <div className="result-img-placeholder" style={{ background: `linear-gradient(135deg, ${cb}, ${cb}cc)` }}>
            {SERVICE_TILES.find(s => s.key === analysisData.category?.toLowerCase())?.icon || '🔧'}
          </div>
        )}
        {boundingBoxes.length > 0 && <BoundingOverlay boxes={showBounding ? boundingBoxes : []} />}

        <div className="result-badge">✦ SNAP AI RESULT</div>
        <div className="result-confidence-badge" style={{ background: needsHumanReview ? 'rgba(239,68,68,0.85)' : 'rgba(0,0,0,0.75)' }}>
          {analysisData.confidence.toFixed(0)}% Confidence
        </div>
        <div className="photo-count-badge">{photos.length} photo{photos.length !== 1 ? 's' : ''} analyzed</div>
      </div>

      {/* MAIN CARD */}
      <div className="result-main-card">
        <div className="result-card-pad">
          {/* HEADER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div style={{ flex: 1, marginRight: 12 }}>
              <div style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 800, lineHeight: 1.2, marginBottom: 6 }}>{analysisData.job}</div>
              <span className="badge badge-teal">{analysisData.category}</span>
            </div>
            <div className="complexity-ring" style={{ borderColor: cc, background: cb }}>
              <div style={{ fontSize: 8, fontWeight: 800, color: cc, textAlign: 'center', lineHeight: 1.2, textTransform: 'uppercase' }}>
                {analysisData.complexity}<br />Risk
              </div>
            </div>
          </div>

          <p style={{ fontSize: 14, color: 'var(--gray)', lineHeight: 1.7, marginBottom: 16 }}>{analysisData.desc}</p>

          {/* STATS */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div className="stat-box">
              <div className="stat-label">Est. Cost</div>
              <div className="stat-value teal">{localizedCost}</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Duration</div>
              <div className="stat-value">{analysisData.laborHours} hrs</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Materials</div>
              <div className="stat-value">{analysisData.materialCost || '—'}</div>
            </div>
          </div>

          {/* CONFIDENCE */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--gray)', fontWeight: 600 }}>AI Confidence</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: needsHumanReview ? '#ef4444' : 'var(--teal)' }}>
                {analysisData.confidence.toFixed(0)}%
              </span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${analysisData.confidence}%`, background: needsHumanReview ? 'linear-gradient(90deg, #ef4444, #f59e0b)' : 'linear-gradient(90deg, var(--teal), #6ee7b7)' }} />
            </div>
          </div>

          {needsHumanReview && (
            <div style={{ background: '#fef2f2', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#991b1b' }}>
              <span>⚠️</span>
              <span>AI is less confident about this estimate. We recommend a <strong>Quick Video Consult</strong> for accuracy.</span>
            </div>
          )}

          {/* QUESTIONS ANSWERED */}
          {answers && answers.length > 0 && (
            <div style={{ marginBottom: 16, background: 'var(--gray-l)', borderRadius: 12, padding: '14px' }}>
              <div style={{ fontFamily: 'Syne', fontSize: 12, fontWeight: 700, color: 'var(--dark)', marginBottom: 8 }}>Your Details</div>
              {answers.map((a, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0' }}>
                  <span style={{ color: 'var(--gray)' }}>{a.question}</span>
                  <span style={{ fontWeight: 600, color: 'var(--dark)' }}>{a.answer}</span>
                </div>
              ))}
            </div>
          )}

          {/* MATERIALS LIST */}
          {analysisData.materials && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: 'Syne', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Estimated Materials</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {analysisData.materials.map(m => (
                  <span key={m} className="badge badge-gray">{m}</span>
                ))}
              </div>
            </div>
          )}

          {/* MAIN CTA */}
          {needsHumanReview ? (
            <>
              <button className="btn btn-red btn-full" style={{ fontSize: 15, padding: '14px', background: '#ef4444', boxShadow: '0 8px 24px rgba(239,68,68,0.3)' }} onClick={() => setShowSheet(true)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                Talk to a Pro ($5)
              </button>
              <button className="btn btn-ghost btn-full" style={{ marginTop: 10 }} onClick={() => setShowSheet(true)}>
                See available pros
              </button>
            </>
          ) : (
            <button className="btn btn-orange btn-full" style={{ fontSize: 16, padding: '15px' }} onClick={() => setShowSheet(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 12.728l-.707.707M12 21h.01"/><path d="M12 8a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"/></svg>
              Find {matchedPros.length} Pros Near You
            </button>
          )}
        </div>
      </div>

      {/* WHAT'S INCLUDED */}
      <div className="result-card" style={{ marginTop: 12 }}>
        <div className="result-card-pad">
          <div style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 800, marginBottom: 14 }}>What's Included</div>
          {[
            'Initial assessment and diagnosis',
            'All labor costs for the repair',
            'Basic parts and materials',
            'Clean-up after job completion',
            '30-day satisfaction guarantee',
          ].map(item => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--teal-xl)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <span style={{ fontSize: 14, color: 'var(--dark)' }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI NOTE */}
      <div style={{ margin: '12px 16px 24px', background: 'linear-gradient(135deg, #1e293b, #0f172a)', borderRadius: 16, padding: '16px 20px', display: 'flex', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0,180,168,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 12.728l-.707.707M12 21h.01"/></svg>
        </div>
        <div>
          <div style={{ fontFamily: 'Syne', fontSize: 13, fontWeight: 700, color: 'var(--teal)', marginBottom: 4 }}>Snap AI Note</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
            Based on {photos.length > 0 ? `${photos.length} photo${photos.length > 1 ? 's' : ''}` : 'demo analysis'}. 
            Cost estimate includes {analysisData.materialCost || '$20-40'} in materials. 
            Final price may vary after in-person assessment.
          </div>
          <button 
            style={{ background: 'none', border: 'none', color: 'var(--teal)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '4px 0', marginTop: 4, textDecoration: 'underline' }}
            onClick={() => setShowBounding(!showBounding)}
          >
            {showBounding ? 'Hide' : 'View'} AI Vision Map
          </button>
        </div>
      </div>

      {/* PRO SHEET */}
      {showSheet && (
        <div className="sheet-overlay" onClick={e => { if (e.target === e.currentTarget) setShowSheet(false); }}>
          <div className="sheet" style={{ maxWidth: '100%', paddingBottom: 'env(safe-area-inset-bottom, 40px)' }}>
            <div className="sheet-handle" />
            <div style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Available Pros</div>
            <div style={{ fontSize: 13, color: 'var(--gray)', marginBottom: 6 }}>Matched for: {analysisData.job}</div>
            {matchedPros.length > 0 && (
              <div style={{ fontSize: 12, color: 'var(--teal)', fontWeight: 600, marginBottom: 16 }}>
                ✓ {matchedPros.length} pros qualified for this estimate
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {matchedPros.map(p => (
                <div key={p.id} className="pro-card" onClick={() => handleBook(p)}>
                  <div className="avatar" style={{ width: 52, height: 52, fontSize: 18, background: `linear-gradient(135deg, ${p.color}cc, ${p.color})`, borderRadius: 14 }}>{p.initials}</div>
                  <div className="pro-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <div className="pro-name">{p.name}</div>
                      {p.verified && <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--teal)"><path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>}
                    </div>
                    <div className="pro-meta">{p.specialty} · {p.dist}</div>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className="stars" style={{ fontSize: 12 }}>★</span>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>{p.rating}</span>
                      <span style={{ fontSize: 12, color: 'var(--gray)' }}>({p.reviews})</span>
                    </div>
                    <div style={{ marginTop: 4 }}><span className="badge badge-teal" style={{ padding: '2px 8px', fontSize: 10 }}>{p.badge}</span></div>
                  </div>
                  <div className="pro-actions">
                    <div className="pro-price">{p.price}/{p.priceUnit}</div>
                    <div style={{ fontSize: 11, color: '#10b981', fontWeight: 600, textAlign: 'right' }}>
                      <span className="avail-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block', marginRight: 4, animation: 'pulse 2s infinite' }} />
                      {p.avail}
                    </div>
                    <button className="btn btn-primary" style={{ padding: '7px 14px', fontSize: 12, borderRadius: 8 }} onClick={e => { e.stopPropagation(); handleBook(p); }}>
                      Book
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
