import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import VideoBackground from '../components/VideoBackground'
import AnalysisResults from '../components/AnalysisResults'

interface HistoryItem {
  id: string
  filename: string
  date: string
  content: string
}

export default function Result() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [activeResult, setActiveResult] = useState<string | null>(null)

  useEffect(() => {
    // Migrate old result if it exists
    const oldResult = localStorage.getItem('zenflow_latest_result')
    if (oldResult) {
      const migratedItem = {
        id: Date.now().toString(),
        filename: 'Previous Analysis',
        date: new Date().toISOString(),
        content: oldResult
      }
      const existingHistoryStr = localStorage.getItem('zenflow_result_history')
      let newHistory = existingHistoryStr ? JSON.parse(existingHistoryStr) : []
      newHistory.push(migratedItem)
      localStorage.setItem('zenflow_result_history', JSON.stringify(newHistory))
      localStorage.removeItem('zenflow_latest_result')
      setHistory(newHistory)
    } else {
      const existingHistoryStr = localStorage.getItem('zenflow_result_history')
      if (existingHistoryStr) {
        setHistory(JSON.parse(existingHistoryStr))
      }
    }
  }, [])

  const handleDelete = (id: string) => {
    const newHistory = history.filter(item => item.id !== id)
    setHistory(newHistory)
    localStorage.setItem('zenflow_result_history', JSON.stringify(newHistory))
  }

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all history?')) {
      setHistory([])
      localStorage.removeItem('zenflow_result_history')
    }
  }

  if (activeResult) {
    return <AnalysisResults markdown={activeResult} onReset={() => setActiveResult(null)} />
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden" style={{ backgroundColor: '#f8f9fb' }}>
      <VideoBackground />
      <Navbar />
      <main
        className="relative z-10 flex flex-col animate-fade-rise page-enter"
        style={{ minHeight: 'calc(100vh - 80px)', padding: 'clamp(1rem, 3vw, 2rem) clamp(0.75rem, 3vw, 1.5rem)', maxWidth: '800px', width: '100%', margin: '0 auto' }}
      >
        <div className="flex items-center justify-between mb-8" style={{ marginTop: '2rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h1 className="font-display" style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', color: '#000000', margin: 0, letterSpacing: '-0.5px' }}>
            Analysis History
          </h1>
          {history.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs cursor-pointer bg-transparent transition-colors"
              style={{
                color: '#EF4444',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '0.6rem 1.2rem',
                borderRadius: '8px',
                fontWeight: 600,
                fontFamily: "'Inter', sans-serif"
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.05)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Clear All
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="text-center" style={{ marginTop: '5rem' }}>
            <div 
              style={{ 
                width: '64px', height: '64px', margin: '0 auto 1.5rem', 
                backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <p style={{ color: '#6F6F6F', fontFamily: "'Inter', sans-serif", fontSize: '1.1rem', marginBottom: '2rem' }}>
              You haven't analyzed any PDFs yet.
            </p>
            <Link
              to="/upload"
              className="no-underline transition-transform hover:scale-[1.03]"
              style={{
                backgroundColor: '#000000',
                color: '#FFFFFF',
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.9rem',
                fontWeight: 500,
                padding: '0.85rem 2rem',
                borderRadius: '9999px',
                display: 'inline-flex',
                boxShadow: '0 4px 14px rgba(0,0,0,0.1)'
              }}
            >
              Start Your First Analysis
            </Link>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', 
            gap: '1.5rem',
            justifyContent: 'center',
            width: '100%'
          }}>
            {history.map((item) => (
              <div
                key={item.id}
                className="group flex flex-col justify-between"
                style={{
                  padding: '1.5rem',
                  backgroundColor: 'rgba(255,255,255,0.85)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '20px',
                  border: '1px solid rgba(0,0,0,0.06)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  minHeight: '160px',
                  position: 'relative'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.08)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'none'
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.04)'
                }}
              >
                <div 
                  className="cursor-pointer flex-1 mb-4" 
                  onClick={() => setActiveResult(item.content)}
                >
                  <p className="font-display line-clamp-2" style={{ fontSize: '1.25rem', margin: '0 0 0.5rem', color: '#111', lineHeight: 1.2 }}>
                    {item.filename}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: '#888', fontFamily: "'Inter', sans-serif", margin: 0 }}>
                    {new Date(item.date).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <button
                    onClick={() => setActiveResult(item.content)}
                    className="cursor-pointer transition-colors"
                    style={{
                      padding: '0.6rem 1.25rem',
                      backgroundColor: '#111',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      color: '#fff',
                      fontFamily: "'Inter', sans-serif"
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#333'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#111'}
                  >
                    View Analysis
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(item.id)
                    }}
                    className="cursor-pointer transition-colors"
                    style={{
                      padding: '0.6rem',
                      backgroundColor: 'transparent',
                      border: '1px solid transparent',
                      borderRadius: '8px',
                      color: '#9CA3AF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = '#FEF2F2'
                      e.currentTarget.style.color = '#EF4444'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.color = '#9CA3AF'
                    }}
                    title="Delete"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
