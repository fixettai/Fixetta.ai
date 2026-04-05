
import React, { useState } from 'react';

export default function ProjectsScreen({ navigate }) {
  const [filter, setFilter] = useState('All');
  const filters = ['All', 'Active', 'Completed', 'Cancelled'];

  const MOCK_PROJECTS = [
    { id: 1, title: 'Leaky Kitchen Faucet', status: 'Completed', date: 'Mar 28, 2026', pro: 'Marcus T.', emoji: '🚿', cost: '105' },
    { id: 2, title: 'IKEA Dresser Assembly', status: 'Completed', date: 'Mar 15, 2026', pro: 'Sarah L.', emoji: '🪑', cost: '90' },
    { id: 3, title: 'Bedroom Wall Repaint', status: 'In Progress', date: 'Apr 2, 2026', pro: 'Ana R.', emoji: '🎨', cost: '240' },
  ];

  const filtered = filter === 'All'
    ? MOCK_PROJECTS
    : MOCK_PROJECTS.filter(p =>
        p.status === filter || (filter === 'Active' && p.status === 'In Progress')
      );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-l)', paddingBottom: 80 }}>
      {/* TOP NAV */}
      <div className="top-nav">
        <div style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 800 }}>My Projects</div>
        <button style={{ background: 'var(--teal)', border: 'none', borderRadius: 100, color: 'white', fontSize: 12, fontWeight: 700, padding: '7px 14px', cursor: 'pointer' }} onClick={() => navigate('camera')}>
          + New
        </button>
      </div>

      <div style={{ padding: '16px' }}>
        {/* STATS */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          {[
            { n: MOCK_PROJECTS.length, l: 'Total Jobs', c: 'var(--teal)' },
            { n: 1, l: 'In Progress', c: 'var(--orange)' },
            { n: 2, l: 'Completed', c: '#10b981' },
          ].map(s => (
            <div key={s.l} style={{ flex: 1, background: 'white', borderRadius: 14, padding: '14px', textAlign: 'center', border: '1.5px solid var(--border)' }}>
              <div style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 800, color: s.c }}>{s.n}</div>
              <div style={{ fontSize: 11, color: 'var(--gray)', fontWeight: 600 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* FILTER */}
        <div className="chip-row" style={{ marginBottom: 16 }}>
          {filters.map(f => (
            <div key={f} className={`chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f}
            </div>
          ))}
        </div>

        {/* PROJECT CARDS */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--gray)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📁</div>
            <div style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No projects yet</div>
            <div style={{ fontSize: 14, marginBottom: 20 }}>Snap a photo to get started</div>
            <button className="btn btn-primary" onClick={() => navigate('camera')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              Snap AI
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(p => (
              <div key={p.id} className="card" style={{ overflow: 'hidden', cursor: 'pointer' }}>
                <div style={{ height: 100, background: 'linear-gradient(135deg, var(--teal-xl), var(--teal-l))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52, position: 'relative' }}>
                  {p.emoji}
                  <div style={{ position: 'absolute', top: 10, right: 10 }}>
                    <span className={`badge ${p.status === 'Completed' ? 'badge-green' : p.status === 'In Progress' ? 'badge-orange' : 'badge-gray'}`}>{p.status}</span>
                  </div>
                </div>
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 700, flex: 1 }}>{p.title}</div>
                    <div style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 800, color: 'var(--teal)', marginLeft: 12 }}>${p.cost}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--gray)' }}>
                    <span>👷 {p.pro}</span>
                    <span>📅 {p.date}</span>
                  </div>
                  {p.status === 'In Progress' && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, marginBottom: 6 }}>
                        <span style={{ color: 'var(--gray)' }}>Progress</span>
                        <span style={{ color: 'var(--teal)' }}>65%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: '65%', background: 'linear-gradient(90deg, var(--teal), #6ee7b7)' }} />
                      </div>
                    </div>
                  )}
                  {p.status === 'Completed' && (
                    <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                      <button className="btn btn-ghost" style={{ flex: 1, padding: '9px', fontSize: 13, borderRadius: 10 }}>⭐ Leave Review</button>
                      <button className="btn btn-primary" style={{ flex: 1, padding: '9px', fontSize: 13, borderRadius: 10 }} onClick={() => navigate('camera')}>Rebook</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SNAP CTA */}
        <div style={{ marginTop: 16, background: 'linear-gradient(135deg, var(--teal), var(--teal-d))', borderRadius: 16, padding: '20px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 800, color: 'white', marginBottom: 6 }}>Got a new problem?</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 14 }}>Snap a photo and get an instant AI estimate</div>
          <button className="btn btn-orange" onClick={() => navigate('camera')} style={{ padding: '11px 24px', fontSize: 14 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            Snap Now
          </button>
        </div>
      </div>
    </div>
  );
}
