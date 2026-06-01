import { useState, useEffect, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const location = useLocation()
  const [isMobile, setIsMobile] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 639px)')
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches)
      if (!e.matches) setIsMobileMenuOpen(false)
    }
    onChange(mql)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  const toggleMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev)
  }, [])

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Upload', path: '/upload' },
    { label: 'Result', path: '/result' },
  ]

  return (
    <nav
      className="relative z-20 w-full"
      style={{ padding: isMobile ? '0.5rem 0.75rem' : '1rem 1.5rem' }}
    >
      <div
        style={{
          maxWidth: '680px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '9999px',
          padding: isMobile
            ? '0.4rem 0.5rem 0.4rem 1rem'
            : '0.5rem 0.5rem 0.5rem 1.5rem',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          boxShadow: '0 2px 16px rgba(0, 0, 0, 0.04)',
          position: 'relative',
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          className="no-underline"
          style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}
        >
          <span
            className="font-display"
            style={{
              fontSize: '1.25rem',
              letterSpacing: '-0.5px',
              color: '#000000',
            }}
          >
            ZenFlow
            <sup
              style={{
                fontSize: '0.5rem',
                verticalAlign: 'super',
                color: '#999',
                marginLeft: '1px',
              }}
            >
              ®
            </sup>
          </span>
        </Link>

        {/* Desktop: Center Nav Links */}
        {!isMobile && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.75rem',
            }}
          >
            {navItems.map(item => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="no-underline"
                  style={{
                    color: isActive ? '#000000' : '#999999',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.8125rem',
                    fontWeight: isActive ? 500 : 400,
                    letterSpacing: '0.01em',
                    transition: 'color 0.2s',
                  }}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        )}

        {/* Desktop: CTA Button */}
        {!isMobile && (
          <Link
            to="/upload"
            className="no-underline"
            style={{
              backgroundColor: '#000000',
              color: '#FFFFFF',
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.8125rem',
              fontWeight: 500,
              padding: '0.5rem 1.25rem',
              borderRadius: '9999px',
              display: 'inline-flex',
              alignItems: 'center',
              flexShrink: 0,
              transition: 'transform 0.2s',
            }}
            onMouseEnter={e =>
              (e.currentTarget.style.transform = 'scale(1.03)')
            }
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            Begin Journey
          </Link>
        )}

        {/* Mobile: Hamburger Button */}
        {isMobile && (
          <button
            onClick={toggleMenu}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#000000"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {isMobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        )}
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobile && (
        <div
          style={{
            maxWidth: '680px',
            margin: '0 auto',
            overflow: 'hidden',
            transition: 'max-height 0.3s ease, opacity 0.3s ease',
            maxHeight: isMobileMenuOpen ? '300px' : '0px',
            opacity: isMobileMenuOpen ? 1 : 0,
          }}
        >
          <div
            style={{
              marginTop: '0.5rem',
              backgroundColor: 'rgba(255, 255, 255, 0.75)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '1.25rem',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
              padding: '0.75rem 1rem',
              display: 'flex',
              flexDirection: 'column' as const,
              gap: '0.25rem',
            }}
          >
            {navItems.map(item => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="no-underline"
                  style={{
                    color: isActive ? '#000000' : '#666666',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 500 : 400,
                    letterSpacing: '0.01em',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '0.75rem',
                    backgroundColor: isActive
                      ? 'rgba(0, 0, 0, 0.04)'
                      : 'transparent',
                    transition: 'background-color 0.2s, color 0.2s',
                    display: 'block',
                  }}
                >
                  {item.label}
                </Link>
              )
            })}

            {/* CTA in mobile menu */}
            <Link
              to="/upload"
              className="no-underline"
              style={{
                marginTop: '0.25rem',
                backgroundColor: '#000000',
                color: '#FFFFFF',
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.875rem',
                fontWeight: 500,
                padding: '0.65rem 1.25rem',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.2s',
              }}
            >
              Begin Journey
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
