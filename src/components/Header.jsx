import React from 'react';
import './Header.css';

/**
 * Header Component - Neomorphic top navigation bar
 * Follows Silk design system with raised/pressed neomorphic effects
 * Mobile-first, 44x44px minimum touch targets
 */
export default function Header({ 
  location = 'Richmond, VA',
  onLocationClick,
  onNotificationClick,
  onProfileClick,
  onBack,
  showBack = false,
  unreadNotifications = 0 
}) {
  return (
    <header className="fixetta-header neo-raised" role="banner">
      <div className="header-content">
        {/* Left Section - Back Button + Brand */}
        <div className="header-left">
          {showBack && (
            <button 
              className="header-back-btn neo-btn" 
              onClick={onBack}
              aria-label="Go back"
              style={{ minWidth: 44, minHeight: 44 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
          <div className="brand" onClick={onLocationClick} role="button" tabIndex={0} style={{ minWidth: showBack ? 'auto' : 44, minHeight: 44 }}>
            <div className="brand-name">
              Fix<span className="brand-accent">etta</span>
            </div>
            <div className="brand-location">
              {location}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 2 }}>
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Right Section - Notifications + Avatar */}
        <div className="header-right">
          <button 
            className="header-notif-btn neo-btn" 
            onClick={onNotificationClick}
            aria-label={`Notifications${unreadNotifications > 0 ? `, ${unreadNotifications} unread` : ''}`}
            style={{ minWidth: 44, minHeight: 44 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadNotifications > 0 && (
              <span className="notif-badge" aria-hidden="true">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </button>
          <button 
            className="header-avatar neo-btn" 
            onClick={onProfileClick}
            aria-label="View profile"
            style={{ minWidth: 44, minHeight: 44 }}
          >
            <span className="avatar-initials">JD</span>
          </button>
        </div>
      </div>
    </header>
  );
}