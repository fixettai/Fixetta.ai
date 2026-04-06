
import React, { useState, useRef } from 'react';
import './MultiPhotoCapture.css';

export default function MultiPhotoCapture({ onComplete, navigate }) {
  const [photos, setPhotos] = useState([]);
  const [capturing, setCapturing] = useState(false);
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'gallery'
  const fileRef = useRef();

  const MAX_PHOTOS = 4;

  const handleFile = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    const newPhotos = [];
    files.forEach(file => {
      if (photos.length + newPhotos.length < MAX_PHOTOS) {
        const url = URL.createObjectURL(file);
        newPhotos.push({ url, name: file.name, type: file.type });
      }
    });
    
    if (newPhotos.length) {
      setPhotos(prev => [...prev, ...newPhotos].slice(0, MAX_PHOTOS));
    }
  };

  const handleRemove = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    if (photos.length === 0) {
      // Allow proceeding with demo even without photos
      onComplete([], 'default');
      return;
    }
    onComplete(photos, photos[0].name);
  };

  const handleDemo = (category) => {
    onComplete([], category);
  };

  return (
    <div className="multi-photo-screen">
      {/* HEADER */}
      <div className="multi-photo-header">
        <button className="top-nav-back" onClick={() => navigate('home')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 800, color: 'white' }}>
          📸 Snap the Problem
        </div>
        <div style={{ width: 28 }} />
      </div>

      {/* INSTRUCTION */}
      <div style={{ padding: '20px 16px 12px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 6 }}>
          Capture up to {MAX_PHOTOS} photos
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
          Wide shot + Close-up = {photos.length > 0 ? photos.length : 'More'}× more accurate estimate
        </div>
      </div>

      {/* PHOTO THUMBNAILS */}
      <div className="photo-strip">
        {Array.from({ length: MAX_PHOTOS }).map((_, i) => {
          const existing = photos[i];
          return (
            <div
              key={i}
              className={`photo-slot ${existing ? 'filled' : ''}`}
              onClick={() => !existing && fileRef.current.click()}
            >
              {existing ? (
                <>
                  <img src={existing.url} alt={`Photo ${i + 1}`} />
                  <button className="photo-remove" onClick={(e) => { e.stopPropagation(); handleRemove(i); }}>×</button>
                  <div className="photo-label">{i === 0 ? '1st' : i === 1 ? '2nd' : i === 2 ? '3rd' : '4th'}</div>
                </>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
              )}
            </div>
          );
        })}
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFile} />
      </div>

      {/* MAIN PREVIEW */}
      <div className="multi-photo-preview">
        {photos.length > 0 ? (
          <img src={photos[0].url} alt="Primary" className="preview-img" />
        ) : (
          <div className="preview-placeholder">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
            </svg>
            <div style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginTop: 12 }}>
              Tap + to add photos
            </div>
          </div>
        )}

        {/* Scan frame overlay */}
        {photos.length > 0 && (
          <div className="cam-scan-frame">
            <div className="cam-corner tl" /><div className="cam-corner tr" />
            <div className="cam-corner bl" /><div className="cam-corner br" />
          </div>
        )}
      </div>

      {/* ADD PHOTO BUTTON */}
      {photos.length < MAX_PHOTOS && (
        <button
          className="add-photo-btn"
          onClick={() => fileRef.current.click()}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Photo
        </button>
      )}

      {/* QUICK EXAMPLES */}
      <div style={{ padding: '0 16px', marginTop: 8 }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 8, textAlign: 'center', letterSpacing: 0.5, textTransform: 'uppercase' }}>
          Or try a demo issue
        </div>
        <div className="demo-scroll">
          {[
            { key: 'plumbing', icon: '🚿', label: 'Leaky Faucet' },
            { key: 'drywall', icon: '🪣', label: 'Wall Damage' },
            { key: 'electrical', icon: '⚡', label: 'Electrical' },
            { key: 'moving', icon: '📦', label: 'Moving' },
          ].map(ex => (
            <button key={ex.key} onClick={() => handleDemo(ex.key)} className="demo-tile">
              <span style={{ fontSize: 22 }}>{ex.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 600 }}>{ex.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* CONTINUE BUTTON */}
      <div style={{ padding: '16px' }}>
        <button className="btn btn-orange btn-full" style={{ fontSize: 15, padding: '14px' }} onClick={handleContinue}>
          {photos.length > 0 ? `Continue with ${photos.length} photo${photos.length > 1 ? 's' : ''}` : 'Continue with Demo Analysis'}
        </button>
        {photos.length === 0 && (
          <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 8 }}>
            You can upload photos later for a more precise estimate
          </div>
        )}
      </div>
    </div>
  );
}
