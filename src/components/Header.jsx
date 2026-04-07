import React, { useState, useRef, useEffect } from 'react';
import './Header.css';
import headerLogo from '../../assets/Header Logo.png';

/**
 * Header Component - Clean minimal top navigation bar with dropdown menu
 * Mobile-first, 44x44px minimum touch targets, 12px border radius
 */
export default function Header({ 
  onNavClick,
  showBack = false,
  onBack,
  setActiveSection = () => {}
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuToggle = () => {
    setMenuOpen((prev) => !prev);
  };

  const handleMenuSelect = (section) => {
    setMenuOpen(false);
    setActiveSection(section);
  };

  return (
    <header className="fixetta-header" role="banner">
      <div className="header-content">
        {/* Left Section - Logo */}
        <div className="header-left">
          {showBack && (
            <button 
              className="header-back-btn" 
              onClick={onBack}
              aria-label="Go back"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
          <div 
            className="header-brand" 
            onClick={onNavClick} 
            role="button" 
            tabIndex={0}
            aria-label="Fixetta Home"
          >
            <img src={headerLogo} alt="Fixetta Logo" className="header-logo" />
          </div>
        </div>

        {/* Right Section - Navigation */}
        <div className="header-right" style={{ position: 'relative' }}>
          <button 
            ref={buttonRef}
            className="header-icon-btn" 
            onClick={handleMenuToggle}
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <nav className="header-dropdown" ref={menuRef} role="menu">
              <button 
                className="header-dropdown-item" 
                role="menuitem"
                onClick={() => handleMenuSelect('home')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                Home
              </button>
              <button 
                className="header-dropdown-item" 
                role="menuitem"
                onClick={() => handleMenuSelect('how-to-use')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                How to Use
              </button>
              <button 
                className="header-dropdown-item" 
                role="menuitem"
                onClick={() => handleMenuSelect('about')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                About Us
              </button>
              <button 
                className="header-dropdown-item" 
                role="menuitem"
                onClick={() => handleMenuSelect('contact')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                Contact Us
              </button>
              <div className="header-dropdown-divider"></div>
              <button 
                className="header-dropdown-item header-dropdown-item--cta" 
                role="menuitem"
                onClick={() => handleMenuSelect('estimate')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                Start Estimating
              </button>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
