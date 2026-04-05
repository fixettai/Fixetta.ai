
import React, { useState } from 'react';

export default function ProfileScreen({ navigate }) {
  const [notifications, setNotifications] = useState(true);
  const [locationServices, setLocationServices] = useState(true);
  const [toast, setToast] = useState(null);

  const menuSections = [
    {
      title: 'Account',
      items: [
        { icon: '👤', bg: '#dbeafe', label: 'Edit Profile', sub: 'Update your info' },
        { icon: '🔔', bg: '#fef9c3', label: 'Notifications', sub: 'Manage alerts' },
        { icon: '📍', bg: '#dcfce7', label: 'Location', sub: 'Service area settings' },
        { icon: '🏠', bg: '#e0f7f6', label: 'Homeowner Vault', sub: 'Your home specs', vault: true },
      ]
    },
    {
      title: 'App',
      items: [
        { icon: '🛡️', bg: '#dcfce7', label: 'Trust & Safety', sub: 'Verification & guarantees' },
        { icon: '❓', bg: '#e0f7f6', label: 'Help Center', sub: 'FAQs & support' },
        { icon: '⭐', bg: '#fef9c3', label: 'Rate the App', sub: 'Leave us a review' },
        { icon: '📣', bg: '#ffe4e6', label: 'Refer a Friend', sub: 'Earn $10 credit' },
      ]
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-l)', paddingBottom: 80 }}>
      {toast && (
        <div className="toast" onClick={() => setToast(null)}>
          {toast}
        </div>
      )}

      {/* HEADER */}
      <div className="profile-header">
        <div className="profile-avatar-wrap" style={{ width: 88, height: 88, borderRadius: '50%', border: '4px solid white', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne', fontSize: 32, fontWeight: 800, background: 'var(--orange)', color: 'white' }}>
          JD
        </div>
        <div style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 4 }}>Jordan Davis</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>jordan@email.com · Richmond, VA</div>
        <div style={{ marginTop: 10, display: 'flex', gap: 8, justifyContent: 'center' }}>
          <span className="badge badge-teal" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>✅ Verified Member</span>
          <span className="badge" style={{ background: 'rgba(255,107,0,0.3)', color: '#fde68a' }}>⭐ 3 Projects</span>
        </div>
      </div>

      {/* STAT CARDS */}
      <div style={{ margin: '-36px 16px 0', display: 'flex', gap: 12 }}>
        {[{ n: '3', l: 'Jobs Done' }, { n: '$435', l: 'Total Saved' }, { n: '4.9★', l: 'Avg Rating' }].map(s => (
          <div key={s.l} className="profile-stat-card" style={{ flex: 1, background: 'white', borderRadius: 16, padding: 16, textAlign: 'center', boxShadow: 'var(--shadow)' }}>
            <div className="profile-stat-num" style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 800, color: 'var(--dark)' }}>{s.n}</div>
            <div className="profile-stat-label" style={{ fontSize: 11, color: 'var(--gray)', fontWeight: 600 }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: '16px 0', marginTop: 20 }}>
        {menuSections.map(sec => (
          <div key={sec.title} style={{ marginBottom: 16 }}>
            <div style={{ padding: '0 16px 8px', fontSize: 11, fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{sec.title}</div>
            <div style={{ background: 'white' }}>
              {sec.items.map((item, i) => (
                <div
                  key={item.label}
                  className="menu-row"
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', cursor: 'pointer', borderBottom: i < sec.items.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.15s' }}
                  onClick={() => item.vault ? navigate('vitals') : setToast(`${item.label} — coming soon!`)}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--gray-l)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div className="menu-icon" style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, background: item.bg }}>{item.icon}</div>
                  <div className="menu-text" style={{ flex: 1 }}>
                    <div className="menu-title" style={{ fontSize: 15, fontWeight: 600, marginBottom: 1 }}>{item.label}</div>
                    <div className="menu-sub" style={{ fontSize: 12, color: 'var(--gray)' }}>{item.sub}</div>
                  </div>
                  <span className="menu-chevron" style={{ color: 'var(--gray)', fontSize: 18 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gray)" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* TOGGLES */}
        <div style={{ background: 'white', marginBottom: 16 }}>
          <div style={{ padding: '0 16px 8px', fontSize: 11, fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: 0.5, paddingTop: 16 }}>Preferences</div>
          <div className="menu-row" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <div className="menu-icon" style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, background: '#fef9c3' }}>🔔</div>
            <div className="menu-text" style={{ flex: 1 }}>
              <div className="menu-title">Push Notifications</div>
              <div className="menu-sub">Job updates & offers</div>
            </div>
            <label className="switch" style={{ position: 'relative', width: 46, height: 26 }}>
              <input type="checkbox" checked={notifications} onChange={e => setNotifications(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
              <span className="slider" style={{ position: 'absolute', inset: 0, background: 'var(--border)', borderRadius: 100, cursor: 'pointer', transition: '0.3s', display: 'block' }}>
                <span style={{ position: 'absolute', width: 20, height: 20, left: 3, top: 3, background: 'white', borderRadius: '50%', transition: '0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.15)', display: 'block', transform: notifications ? 'translateX(20px)' : 'none' }} />
              </span>
            </label>
          </div>
          <div className="menu-row" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px' }}>
            <div className="menu-icon" style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, background: '#dcfce7' }}>📍</div>
            <div className="menu-text" style={{ flex: 1 }}>
              <div className="menu-title">Location Services</div>
              <div className="menu-sub">For better pro matching</div>
            </div>
            <label className="switch" style={{ position: 'relative', width: 46, height: 26 }}>
              <input type="checkbox" checked={locationServices} onChange={e => setLocationServices(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
              <span className="slider" style={{ position: 'absolute', inset: 0, background: locationServices ? 'var(--teal)' : 'var(--border)', borderRadius: 100, cursor: 'pointer', transition: '0.3s', display: 'block' }}>
                <span style={{ position: 'absolute', width: 20, height: 20, left: 3, top: 3, background: 'white', borderRadius: '50%', transition: '0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.15)', display: 'block', transform: locationServices ? 'translateX(20px)' : 'none' }} />
              </span>
            </label>
          </div>
        </div>

        {/* SIGN OUT */}
        <div style={{ background: 'white' }}>
          <div className="menu-row" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', cursor: 'pointer' }} onClick={() => setToast('Signed out — goodbye!')}>
            <div className="menu-icon" style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, background: '#fee2e2' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </div>
            <div className="menu-text" style={{ flex: 1 }}>
              <div className="menu-title" style={{ fontSize: 15, fontWeight: 600, marginBottom: 1, color: '#ef4444' }}>Sign Out</div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '20px', fontSize: 12, color: 'var(--gray)' }}>
          Fixetta v2.0.0 · Richmond, VA · © 2026
        </div>
      </div>
    </div>
  );
}
