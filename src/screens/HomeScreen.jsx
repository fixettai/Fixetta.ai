
import React, { useState } from 'react';
import { AI_ANALYSES } from '../data/mockData';

export default function HomeScreen({ navigate, setAnalysis, setPhotos }) {
  const [activeChip, setActiveChip] = useState('All');
  const chips = ['All', 'Plumbing', 'Electric', 'Assembly', 'Painting', 'Moving', 'Roofing'];

  const handleServiceTap = (key) => {
    setAnalysis(AI_ANALYSES[key] || AI_ANALYSES.default);
    setPhotos([]);
    navigate('result');
  };

  const PROS = [
    { id:1, name:'Marcus T.', rating:4.97, reviews:218, specialty:'Plumbing & Pipes', dist:'0.8 mi', avail:'Today 2pm', price:'95', priceUnit:'hr', initials:'MT', color:'#0ea5e9', badge:'Top Pro', jobs:342, verified:true },
    { id:2, name:'Sarah L.', rating:4.94, reviews:176, specialty:'Handyman & Repairs', dist:'1.2 mi', avail:'Today 4pm', price:'75', priceUnit:'hr', initials:'SL', color:'#8b5cf6', badge:'Fast Response', jobs:289, verified:true },
    { id:3, name:'James W.', rating:4.91, reviews:203, specialty:'General Contracting', dist:'2.1 mi', avail:'Tomorrow 9am', price:'85', priceUnit:'hr', initials:'JW', color:'#f59e0b', badge:'Licensed & Insured', jobs:410, verified:true },
  ];

  return (
    <div className="page-content anim-fade-in" style={{ background: 'var(--gray-l)' }}>
      {/* TOP NAV */}
      <header className="top-nav">
        <div>
          <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 20 }}>Fix<span style={{ color: 'var(--teal)' }}>etta</span></div>
          <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: -2 }}>Richmond, VA ▾</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="top-nav-back" style={{ position: 'relative' }} onClick={() => alert('Notifications coming soon!')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <span className="notif-dot" />
          </button>
          <div className="avatar" style={{ width: 36, height: 36, background: 'linear-gradient(135deg, var(--teal), var(--teal-d))', fontSize: 14, cursor: 'pointer' }} onClick={() => navigate('profile')}>JD</div>
        </div>
      </header>

      {/* HERO BANNER */}
      <div style={{ margin: '16px', borderRadius: 20, background: 'linear-gradient(135deg, var(--teal), var(--teal-d))', padding: '24px 20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ position: 'absolute', bottom: -20, right: 40, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', marginBottom: 12, fontSize: 11 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6ee7b7', animation: 'pulse 2s infinite', display: 'inline-block' }} />
          Live in Richmond, VA
        </div>
        <div style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 800, color: 'white', lineHeight: 1.2, marginBottom: 8 }}>
          Snap the problem.<br/>
          <span style={{ color: '#fde68a' }}>Get it fixed fast.</span>
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 20, lineHeight: 1.5 }}>
          One photo → AI estimate → local pro booked
        </div>
        <button className="btn btn-orange" onClick={() => navigate('camera')} style={{ padding: '12px 24px', fontSize: 15, boxShadow: '0 8px 20px rgba(255,107,0,.4)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          Try Snap AI
        </button>
      </div>

      {/* SEARCH */}
      <div style={{ padding: '0 16px 16px' }}>
        <div className="search-bar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gray)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input className="search-input" placeholder="Search for a service or describe your issue…" readOnly style={{ cursor: 'pointer' }} />
        </div>
      </div>

      {/* SERVICES */}
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div className="section-title" style={{ fontSize: 18 }}>Services</div>
          <span style={{ fontSize: 13, color: 'var(--teal)', fontWeight: 600, cursor: 'pointer' }}>See all</span>
        </div>
        <div className="h-scroll">
          {[
            { icon: '🔧', name: 'Plumbing', key: 'plumbing' },
            { icon: '⚡', name: 'Electric', key: 'electrical' },
            { icon: '🪑', name: 'Assembly', key: 'furniture' },
            { icon: '📦', name: 'Moving', key: 'moving' },
            { icon: '🎨', name: 'Painting', key: 'painting' },
            { icon: '🪟', name: 'Drywall', key: 'drywall' },
            { icon: '🏠', name: 'Roofing', key: 'roof' },
            { icon: '✨', name: 'Cleaning', key: 'default' },
          ].map(s => (
            <div key={s.key} className="service-tile" onClick={() => handleServiceTap(s.key)}>
              <span className="service-tile-icon">{s.icon}</span>
              <div className="service-tile-name">{s.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FILTER CHIPS */}
      <div style={{ padding: '0 16px 12px' }}>
        <div className="chip-row">
          {chips.map(c => (
            <div key={c} className={`chip ${activeChip === c ? 'active' : ''}`} onClick={() => setActiveChip(c)}>
              {c}
            </div>
          ))}
        </div>
      </div>

      {/* FEATURED PROS */}
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div className="section-title" style={{ fontSize: 18 }}>Top Pros Near You</div>
          <span style={{ fontSize: 13, color: 'var(--teal)', fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate('pros')}>View all</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {PROS.map(p => (
            <div key={p.id} className="pro-card" onClick={() => navigate('pros')}>
              <div className="avatar" style={{ width: 52, height: 52, fontSize: 18, background: `linear-gradient(135deg, ${p.color}cc, ${p.color})` }}>{p.initials}</div>
              <div className="pro-info">
                <div className="pro-name">{p.name}</div>
                <div className="pro-meta">{p.specialty} · {p.dist}</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span className="stars" style={{ fontSize: 12 }}>★</span>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{p.rating}</span>
                  <span style={{ fontSize: 12, color: 'var(--gray)' }}>({p.reviews})</span>
                  <span className="badge badge-teal" style={{ padding: '2px 8px', fontSize: 10 }}>{p.badge}</span>
                </div>
              </div>
              <div className="pro-actions">
                <div className="pro-price">{p.price}/{p.priceUnit}</div>
                <div style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>
                  <span className="avail-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block', marginRight: 4, animation: 'pulse 2s infinite' }} />
                  {p.avail}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div style={{ margin: '0 16px 16px', background: 'var(--dark)', borderRadius: 20, padding: '24px 20px' }}>
        <div style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 800, color: 'white', marginBottom: 4 }}>How Fixetta Works</div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>Fixed in 4 simple steps</div>
        {[
          { n: '01', icon: '📸', t: 'Snap Photos', d: 'Upload multiple photos for accuracy' },
          { n: '02', icon: '🤖', t: 'AI Estimates Instantly', d: 'Cost, materials & time in seconds' },
          { n: '03', icon: '👷', t: 'Browse Vetted Pros', d: 'See ratings, prices, availability' },
          { n: '04', icon: '✅', t: 'Book & Get Fixed', d: 'Same-day or next-day scheduling' },
        ].map(s => (
          <div key={s.n} className="timeline-item">
            <div className="timeline-dot" />
            <div className="timeline-body">
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 20 }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>{s.t}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{s.d}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* TRUST STRIP */}
      <div style={{ margin: '0 16px 32px', background: 'white', borderRadius: 16, padding: '16px 20px', display: 'flex', justifyContent: 'space-around' }}>
        {[
          { icon: '⭐', val: '4.9/5', label: 'Avg Rating' },
          { icon: '✅', val: '1,200+', label: 'Jobs Done' },
          { icon: '🛡️', val: '100%', label: 'Vetted Pros' },
        ].map(t => (
          <div key={t.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{t.icon}</div>
            <div style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 800 }}>{t.val}</div>
            <div style={{ fontSize: 11, color: 'var(--gray)' }}>{t.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
