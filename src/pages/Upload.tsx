import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import VideoBackground from '../components/VideoBackground'
import FileUploader from '../components/FileUploader'
import AnalysisResults from '../components/AnalysisResults'

// In production, VITE_API_URL points to the Render backend.
// In dev, it's empty so the Vite proxy handles /api → localhost:3001.
const API_BASE = import.meta.env.VITE_API_URL || ''

export default function Upload() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<string | null>(null)
  const [serverOnline, setServerOnline] = useState<boolean | null>(null)

  // === Health check on mount ===
  useEffect(() => {
    let cancelled = false
    async function checkHealth() {
      try {
        const res = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(5000) })
        if (!cancelled) setServerOnline(res.ok)
      } catch {
        if (!cancelled) setServerOnline(false)
      }
    }
    checkHealth()
    return () => { cancelled = true }
  }, [])

  // === Submit handler ===
  const handleFileSelected = async (file: File) => {
    setIsAnalyzing(true)
    setError(null)

    const formData = new FormData()
    formData.append('pdf', file)

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5 * 60 * 1000)

      const res = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      })
      clearTimeout(timeout)

      if (!res.ok) {
        // Since backend might still send JSON for errors, we try to parse it
        let errorData
        try {
          const clonedRes = res.clone()
          errorData = await clonedRes.json()
        } catch {
          errorData = { message: 'Server error occurred' }
        }

        if (errorData?.error === 'RATE_LIMITED') {
          throw new Error('AI service busy. Wait 30–60 seconds and retry.')
        }
        throw new Error(errorData?.message || 'Analysis failed.')
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error('Failed to start response stream.')

      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullText += decoder.decode(value, { stream: true })
        setAnalysisResult(fullText)
      }

      const newHistoryItem = {
        id: Date.now().toString(),
        filename: file.name,
        date: new Date().toISOString(),
        content: fullText,
      }
      
      const existingHistoryStr = localStorage.getItem('zenflow_result_history')
      let history = []
      try {
        history = existingHistoryStr ? JSON.parse(existingHistoryStr) : []
      } catch {
        history = []
      }
      
      history.unshift(newHistoryItem) // prepend to the start
      localStorage.setItem('zenflow_result_history', JSON.stringify(history))
      
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Analysis took too long (over 5 minutes). Try a smaller or clearer PDF.')
      } else if (
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('NetworkError') ||
        err.message?.includes('Load failed')
      ) {
        setError('Cannot reach the server. Make sure the backend is running (npm run server).')
        setServerOnline(false)
      } else {
        console.error('Analysis failed:', err)
        setError(err.message || 'Something went wrong.')
      }
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleReset = () => {
    setAnalysisResult(null)
    setError(null)
  }

  // ── Show results when analysis is complete ──
  if (analysisResult) {
    return <AnalysisResults markdown={analysisResult} onReset={handleReset} />
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Video Background — same as landing */}
      <VideoBackground />

      {/* Navigation */}
      <Navbar />

      {/* Server Offline Banner */}
      {serverOnline === false && (
        <div
          className="relative z-20 mx-auto animate-fade-rise"
          style={{
            maxWidth: '600px',
            margin: '0 auto',
            padding: '0.875rem 1.5rem',
            backgroundColor: 'rgba(220, 38, 38, 0.04)',
            border: '1px solid rgba(220, 38, 38, 0.12)',
            borderRadius: '16px',
            textAlign: 'center',
            marginTop: '0.5rem',
          }}
        >
          <p style={{ fontSize: '0.8125rem', color: '#DC2626', margin: 0 }}>
            <strong>⚠️ Server offline</strong> — The backend isn't reachable. Start it with{' '}
            <code style={{
              backgroundColor: 'rgba(220, 38, 38, 0.08)',
              padding: '0.125rem 0.375rem',
              borderRadius: '4px',
              fontSize: '0.75rem',
            }}>npm run server</code>{' '}
            then refresh this page.
          </p>
        </div>
      )}

      {/* Main Content — vertically & horizontally centered */}
      <main
        className="relative z-10 flex flex-col items-center justify-center text-center"
        style={{ minHeight: 'calc(100vh - 80px)', padding: '1.5rem', width: '100%', maxWidth: '720px', margin: '0 auto' }}
      >
        {/* Main Interface OR Loading State */}
        {!isAnalyzing ? (
          <>
            {/* Header */}
            <div className="w-full flex flex-col items-center justify-center text-center animate-fade-rise" style={{ marginBottom: 'clamp(1.5rem, 4vw, 3rem)' }}>
              <h1
                className="w-full font-display font-normal text-center"
                style={{
                  fontSize: 'clamp(2.5rem, 6vw, 5rem)',
                  lineHeight: 0.95,
                  letterSpacing: '-2px',
                  color: '#000000',
                  marginBottom: '2rem',
                }}
              >
                Upload your{' '}
                <em style={{ color: '#6F6F6F', fontStyle: 'italic' }}>paper</em>
              </h1>
              <p
                className="text-base sm:text-lg text-center text-balance leading-relaxed max-w-lg mx-auto"
                style={{ color: '#6F6F6F', fontFamily: "'Inter', sans-serif" }}
              >
                Upload a single PDF containing all your previous year question papers.
                We'll find every repeat and predict what's next.
              </p>
            </div>

            {/* File Uploader */}
            <div className="w-full animate-fade-rise-delay" style={{ marginTop: '0.5rem' }}>
              <FileUploader onFileSelected={handleFileSelected} isUploading={isAnalyzing} />
            </div>

            {/* Error Display */}
            {error && (
              <div
                className="max-w-xl rounded-2xl px-6 py-4 text-center animate-fade-rise"
                style={{
                  marginTop: '1.5rem',
                  backgroundColor: 'rgba(220, 38, 38, 0.04)',
                  border: '1px solid rgba(220, 38, 38, 0.12)',
                  color: '#DC2626',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <p className="text-sm" style={{ marginBottom: '0.5rem' }}>{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="text-xs cursor-pointer bg-transparent border-none"
                  style={{
                    color: '#DC2626',
                    textDecoration: 'underline',
                    opacity: 0.7,
                    padding: 0,
                  }}
                >
                  Dismiss
                </button>
              </div>
            )}

          </>
        ) : (
          /* ── Loading State ── */
          <div className="animate-fade-rise" style={{ padding: '1.5rem 0', width: '100%' }}>
            <div
              className="rounded-3xl"
              style={{
                padding: '3rem 2.5rem',
                backgroundColor: 'rgba(255, 255, 255, 0.72)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                boxShadow: '0 8px 40px rgba(0, 0, 0, 0.06)',
              }}
            >
              <div className="flex flex-col items-center gap-5">
                {/* Animated dots */}
                <div className="flex items-center gap-3">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="rounded-full"
                      style={{
                        width: '10px',
                        height: '10px',
                        backgroundColor: '#000000',
                        animation: `float 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>

                {/* Message */}
                <div style={{ textAlign: 'center' }}>
                  <p className="font-display mb-2" style={{ fontSize: '1.75rem', color: '#000000', letterSpacing: '-0.5px' }}>
                    🤖 Analyzing your exam papers...
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#000000', fontFamily: "'Inter', sans-serif", opacity: 0.5 }}>
                    Running 7-layer deep analysis. This takes 30–90 seconds.
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#000000', fontFamily: "'Inter', sans-serif", opacity: 0.35, marginTop: '0.5rem' }}>
                    Please don't close this tab.
                  </p>
                </div>

                {/* Pulsing bar */}
                <div style={{ width: '200px', marginTop: '0.5rem' }}>
                  <div style={{
                    height: '4px',
                    borderRadius: '2px',
                    background: 'rgba(0,0,0,0.08)',
                    overflow: 'hidden',
                  }}>
                    <div className="animate-shimmer" style={{
                      height: '100%',
                      borderRadius: '2px',
                      background: 'linear-gradient(90deg, transparent 0%, #000 50%, transparent 100%)',
                      backgroundSize: '200% 100%',
                    }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
