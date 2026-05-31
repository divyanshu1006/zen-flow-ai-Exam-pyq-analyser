import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const location = useLocation()

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Upload', path: '/upload' },
    { label: 'Result', path: '/result' },
  ]

  return (
    <nav
      className="relative z-20 w-full"
      style={{ padding: '1rem 1.5rem' }}
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
          padding: '0.5rem 0.5rem 0.5rem 1.5rem',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          boxShadow: '0 2px 16px rgba(0, 0, 0, 0.04)',
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

        {/* Center Nav Links */}
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

        {/* CTA Button */}
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
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          Begin Journey
        </Link>
      </div>
    </nav>
  )
}
