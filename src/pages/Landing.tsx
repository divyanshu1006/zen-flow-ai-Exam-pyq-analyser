import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import VideoBackground from '../components/VideoBackground'

export default function Landing() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden" style={{ backgroundColor: '#FFFFFF' }}>
      <VideoBackground />
      <Navbar />

      <main
        className="relative z-10 flex flex-col items-center justify-center text-center"
        style={{ minHeight: 'calc(100vh - 80px)', padding: '1.5rem', width: '100%', maxWidth: '900px', margin: '0 auto' }}
      >
        <div className="w-full flex flex-col items-center justify-center text-center animate-fade-rise">
          <h1
            className="w-full font-display font-normal text-center"
            style={{
              fontSize: 'clamp(3rem, 8vw, 6rem)',
              lineHeight: 0.95,
              letterSpacing: '-2px',
              color: '#000000',
              marginBottom: '1.5rem',
            }}
          >
            Conquer Your{' '}
            <em style={{ color: '#6F6F6F', fontStyle: 'italic' }}>Exams</em>
          </h1>
          <p
            className="text-base sm:text-lg text-center text-balance leading-relaxed max-w-2xl mx-auto"
            style={{ color: '#6F6F6F', fontFamily: "'Inter', sans-serif", marginBottom: '2.5rem' }}
          >
            ZenFlow AI uses a powerful 7-layer analysis to scan your previous year question papers. 
            Discover exactly what you need to study, which topics will repeat, and what you can safely skip.
          </p>

          <Link
            to="/upload"
            className="no-underline shadow-xl transition-all duration-300 hover:scale-[1.03]"
            style={{
              backgroundColor: '#000000',
              color: '#FFFFFF',
              fontFamily: "'Inter', sans-serif",
              fontSize: '1rem',
              fontWeight: 500,
              padding: '0.875rem 2rem',
              borderRadius: '9999px',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            Get Started Now
          </Link>
        </div>

        {/* Info Cards */}
        <div className="w-full animate-fade-rise-delay" style={{ marginTop: 'clamp(3rem, 6vw, 4rem)' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'clamp(1rem, 2vw, 1.5rem)',
          }}>
          {[
            {
              title: 'Extract',
              desc: 'Every question identified and categorized.',
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              ),
            },
            {
              title: 'Analyze',
              desc: 'Find repeats with exact frequency counts.',
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              ),
            },
            {
              title: 'Predict',
              desc: 'Probability scores for each question.',
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              ),
            },
          ].map((item, i) => (
            <div
              key={i}
              className="text-center rounded-2xl transition-all duration-300 hover:scale-[1.02]"
              style={{
                padding: 'clamp(1.5rem, 3vw, 2rem) clamp(1rem, 2vw, 1.5rem)',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(0,0,0,0.06)',
              }}
            >
              <div
                className="rounded-xl flex items-center justify-center mx-auto mb-4"
                style={{
                  width: '56px',
                  height: '56px',
                  backgroundColor: 'rgba(0,0,0,0.04)',
                }}
              >
                {item.icon}
              </div>
              <h3
                className="font-display text-black mb-2"
                style={{ fontSize: '1.25rem' }}
              >
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: '#6F6F6F' }}>
                {item.desc}
              </p>
            </div>
          ))}
          </div>
        </div>
      </main>
    </div>
  )
}
