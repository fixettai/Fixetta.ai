
import React, { useState } from 'react';

export default function ProsScreen({ navigate, analysis }) {
  const [filter, setFilter] = useState('All');
  const [selectedPro, setSelectedPro] = useState(null);
  const [booked, setBooked] = useState(false);
  const filters = ['All', 'Available Today', 'Top Rated', 'Nearest', 'Lowest Price'];

  const PROS = [
    { id:1, name:'Marcus T.', rating:4.97, reviews:218, specialty:'Plumbing & Pipes', dist:'0.8 mi', avail:'Today 2pm', price:'95', priceUnit:'hr', initials:'MT', color:'#0ea5e9', badge:'Top Pro', jobs:342, verified:true, categories:['Plumbing','Handyman'] },
    { id:2, name:'Sarah L.', rating:4.94, reviews:176, specialty:'Handyman & Repairs', dist:'1.2 mi', avail:'Today 4pm', price:'75', priceUnit:'hr', initials:'SL', color:'#8b5cf6', badge:'Fast Response', jobs:289, verified:true, categories:['Handyman','Assembly','Painting'] },
    { id:3, name:'James W.', rating:4.91, reviews:203, specialty:'General Contracting', dist:'2.1 mi', avail:'Tomorrow 9am', price:'85', priceUnit:'hr', initials:'JW', color:'#f59e0b', badge:'Licensed & Insured', jobs:410, verified:true, categories:['Handyman','Painting','Roofing'] },
    { id:4, name:'Ana R.', rating:4.89, reviews:134, specialty:'Interior & Painting', dist:'1.5 mi', avail:'Today 6pm', price:'70', priceUnit:'hr', initials:'AR', color:'#ec4899', badge:'Background Checked', jobs:196, verified:true, categories:['Painting','Handyman'] },
    { id:5, name:'Derek M.', rating:4.86, reviews:97, specialty:'Electrical & Smart Home', dist:'3.0 mi', avail:'Tomorrow 11am', price:'110', priceUnit:'hr', initials:'DM', color:'#10b981', badge:'Master Electrician', jobs:158, verified:true, categories:['Electrical','Handyman'] },
    { id:6, name:'Chris B.', rating:4.83, reviews:145, specialty:'Roofing & Gutters', dist:'2.8 mi', avail:'Tomorrow 8am', price:'90', priceUnit:'hr', initials:'CB', color:'#f97316', badge:'Certified Roofer', jobs:267, verified:true, categories:['Roofing','Handyman'] },
  ];

  const handleBook = (pro) => {
    setSelectedPro(pro);
    setBooked(true);
  };

  if (booked && selectedPro) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--gray-l)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, paddingBottom: 80 }}>
        <div className="success-ring" style={{ width: 96, height: 96, borderRadius: '50%', background: 'var(--teal-xl)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, animation: 'bounceIn 0.6s cubic-bezier(.34,1.56,.64,1)' }}>
          🎉
        </div>
        <div style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Pro Booked!</div>
        <div style={{ fontSize: 14, color: 'var(--gray)', marginBottom: 20, textAlign: 'center', lineHeight: 1.6 }}>
          {selectedPro.name} has been notified and will arrive {selectedPro.avail}
        </div>
        <div style={{ display: 'flex', gap: 10, flexDirection: 'column', width: '100%', maxWidth: 320 }}>
          <button className="btn btn-primary btn-full" onClick={() => { setBooked(false); navigate('projects'); }}>View in My Projects</button>
          <button className="btn btn-ghost btn-full" onClick={() => setBooked(false)}>Back to Pros</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-l)', paddingBottom: 80 }}>
      {/* TOP NAV */}
      <div className="top-nav">
        <button className="top-nav-back" onClick={() => navigate('home')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 800 }}>Local Pros</div>
        <div style={{ width: 36 }} />
      </div>

      <div style={{ padding: '16px' }}>
        {/* MAP PLACEHOLDER */}
        <div style={{ height: 140, borderRadius: 16, background: 'linear-gradient(135deg, #e0f7f6, #b2f0ec)', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', border: '1.5px solid var(--border)' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) 1px, transparent 1px, transparent 40px)' }} />
          {PROS.slice(0, 3).map((p, i) => (
            <div key={p.id} style={{ position: 'absolute', top: `${25 + i*18}%`, left: `${20 + i*25}%`, width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${p.color}cc, ${p.color})`, border: '3px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white', fontFamily: 'Syne', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', cursor: 'pointer', animation: 'float 3s ease-in-out infinite', animationDelay: `${i*0.5}s` }} onClick={() => setSelectedPro(p)}>
              {p.initials}
            </div>
          ))}
          <div style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', borderRadius: 10, padding: '6px 12px', fontSize: 12, fontWeight: 600, color: 'var(--dark)', position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
            📍 Richmond, VA · {PROS.length} pros nearby
          </div>
        </div>

        {/* FILTER CHIPS */}
        <div className="chip-row" style={{ marginBottom: 16 }}>
          {filters.map(f => (
            <div key={f} className={`chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f}
            </div>
          ))}
        </div>

        {/* PRO LIST */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {PROS.map(p => (
            <div key={p.id} className="card" style={{ borderRadius: 16, cursor: 'pointer' }} onClick={() => setSelectedPro(selectedPro?.id === p.id ? null : p)}>
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div className="avatar" style={{ width: 60, height: 60, fontSize: 20, background: `linear-gradient(135deg, ${p.color}cc, ${p.color})`, borderRadius: 16, flexShrink: 0 }}>{p.initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <div style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 700 }}>{p.name}</div>
                      {p.verified && <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--teal)"><path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--gray)', marginBottom: 6 }}>{p.specialty} · {p.dist} · {p.jobs} jobs done</div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className="stars" style={{ fontSize: 13 }}>★</span>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{p.rating}</span>
                      <span style={{ fontSize: 13, color: 'var(--gray)' }}>({p.reviews} reviews)</span>
                    </div>
                    <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span className="badge badge-teal" style={{ padding: '3px 10px', fontSize: 11 }}>{p.badge}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <div style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 800, color: 'var(--teal)' }}>{p.price}/{p.priceUnit}</div>
                    <div style={{ fontSize: 11, color: '#10b981', fontWeight: 600, textAlign: 'right' }}>
                      <span className="avail-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block', marginRight: 4, animation: 'pulse 2s infinite' }} />
                      {p.avail}
                    </div>
                    <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 13 }} onClick={e => { e.stopPropagation(); handleBook(p); }}>
                      Book Now
                    </button>
                  </div>
                </div>

                {selectedPro?.id === p.id && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }} className="anim-fade-up">
                    {/* Rating bars */}
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontFamily: 'Syne', fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Customer Ratings</div>
                      {[{ l: '5', w: '82%' }, { l: '4', w: '12%' }, { l: '3', w: '4%' }, { l: '2', w: '1%' }, { l: '1', w: '1%' }].map(r => (
                        <div key={r.l} className="rating-bar-row">
                          <span className="rating-label">{r.l}</span>
                          <div className="rating-bar"><div className="rating-fill" style={{ width: r.w }} /></div>
                          <span style={{ fontSize: 11, color: 'var(--gray)', width: 30 }}>{r.w}</span>
                        </div>
                      ))}
                    </div>
                    {/* Reviews */}
                    <div style={{ fontFamily: 'Syne', fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Recent Reviews</div>
                    {[
                      { name: 'Jennifer M.', text: 'Arrived on time, did great work, very professional.', rating: 5 },
                      { name: 'David R.', text: 'Fixed our plumbing issue quickly. Highly recommend!', rating: 5 },
                    ].map(r => (
                      <div key={r.name} style={{ background: 'var(--gray-l)', borderRadius: 12, padding: '12px', marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</span>
                          <span className="stars" style={{ fontSize: 12 }}>{'★'.repeat(r.rating)}</span>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--gray)', fontStyle: 'italic' }}>"{r.text}"</div>
                      </div>
                    ))}
                    <button className="btn btn-orange btn-full" style={{ marginTop: 8, padding: '13px' }} onClick={() => handleBook(p)}>
                      Book {p.name} — {p.avail}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
