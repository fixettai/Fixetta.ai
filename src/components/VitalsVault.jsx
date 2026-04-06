
import React, { useState, useEffect } from 'react';
import './VitalsVault.css';
import { VITALS_DEFAULT } from '../data/mockData';
import { storage } from '../utils/aiPipeline';

export default function VitalsVault({ onComplete, navigate, onNext }) {
  const [vitals, setVitals] = useState(VITALS_DEFAULT);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load saved vitals
    const saved = storage.get('vitals');
    if (saved) {
      if (saved.skipVitals) {
        onNext();
        return;
      }
      setVitals({ ...VITALS_DEFAULT, ...saved });
    }
  }, []);

  const handleChange = (key, value) => {
    setVitals(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    storage.set('vitals', vitals);
    setSaved(true);
    setTimeout(() => {
      onNext();
    }, 600);
  };

  const handleSkip = () => {
    storage.set('vitals', { skipVitals: true });
    onNext();
  };

  // If user has seen this before with skip, pass through
  const vitalsList = [
    { key: 'homeType', label: 'Home Type', options: ['Single Family', 'Townhouse', 'Condo', 'Apartment'] },
    { key: 'yearBuilt', label: 'Year Built', options: ['Before 1970', '1970–1990', '1991–2010', '2010+'] },
    { key: 'sqft', label: 'Sq Ft (approx)', options: ['<1,000', '1,000–1,500', '1,500–2,500', '2,500+'] },
    { key: 'plumbing', label: 'Main Pipes', options: ['Copper', 'PEX', 'PVC', "Don't know"] },
    { key: 'electrical', label: 'Electrical Panel', options: ['100 Amp', '200 Amp', "Don't know"] },
  ];

  return (
    <div className="vitals-screen">
      {/* BACK */}
      <button className="top-nav-back" style={{ marginLeft: 16, marginTop: 44, background: 'rgba(255,255,255,0.1)', border: 'none' }} onClick={() => navigate('home')}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
      </button>

      <div style={{ padding: '20px 16px' }}>
        <div style={{ fontSize: 12, color: 'var(--teal)', fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>
          🏠 HOMEOWNER VAULT
        </div>
        <div style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 800, color: 'white', lineHeight: 1.2, marginBottom: 6 }}>
          Your Home's Specs
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: 24 }}>
          This helps us provide <strong style={{ color: 'var(--teal)' }}>2× more accurate estimates</strong>. Only takes 30 seconds.
        </div>

        {/* VITALS FORM */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          {vitalsList.map(v => (
            <div key={v.key} className="vitals-group">
              <div className="vitals-label">{v.label}</div>
              <div className="vitals-chips">
                {v.options.map(opt => (
                  <button
                    key={opt}
                    className={`vitals-chip ${vitals[v.key] === opt ? 'active' : ''}`}
                    onClick={() => handleChange(v.key, opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* BENEFITS */}
        <div style={{ background: 'rgba(0,180,168,0.08)', borderRadius: 14, padding: '14px 16px', marginBottom: 24, border: '1px solid rgba(0,180,168,0.2)' }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>💡</span>
            <span>Pro tip: <strong style={{ color: 'white' }}>Older homes</strong> often have outdated plumbing or electrical systems that affect repair complexity.</span>
          </div>
        </div>

        {/* SAVE BUTTON */}
        <button
          className={`btn btn-full ${saved ? 'btn-teal-saved' : 'btn-primary'}`}
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          onClick={handleSave}
        >
          {saved ? '✓ Saved!' : 'Save & Continue'}
        </button>

        {/* SKIP */}
        <button className="vitals-skip" onClick={handleSkip}>
          Skip for now — I'll add this later
        </button>
      </div>
    </div>
  );
}
