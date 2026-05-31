import { useState, useMemo, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Navbar from './Navbar'

/* ───────────────────────────────────────────────────
   TYPES
   ─────────────────────────────────────────────────── */
interface AnalysisResultsProps {
  markdown: string
  onReset: () => void
}

interface Section {
  heading: string
  content: string
  layerNum: number | null
}

/* ───────────────────────────────────────────────────
   LAYER CONFIG — colors, icons, short labels
   ─────────────────────────────────────────────────── */
const LAYER_CONFIG: Record<number, {
  color: string; gradient: string; soft: string; border: string
  icon: string; shortName: string
}> = {
  1: { color: '#3B82F6', gradient: 'linear-gradient(135deg, #3B82F6, #2563EB)', soft: 'rgba(59,130,246,0.07)',  border: 'rgba(59,130,246,0.18)',  icon: '📊', shortName: 'Marks Weight' },
  2: { color: '#F59E0B', gradient: 'linear-gradient(135deg, #F59E0B, #D97706)', soft: 'rgba(245,158,11,0.07)',  border: 'rgba(245,158,11,0.18)',  icon: '📅', shortName: 'Recency' },
  3: { color: '#8B5CF6', gradient: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', soft: 'rgba(139,92,246,0.07)',  border: 'rgba(139,92,246,0.18)',  icon: '✂️', shortName: 'Part Split' },
  4: { color: '#EF4444', gradient: 'linear-gradient(135deg, #EF4444, #DC2626)', soft: 'rgba(239,68,68,0.07)',   border: 'rgba(239,68,68,0.18)',   icon: '🗑️', shortName: 'Skip List' },
  5: { color: '#10B981', gradient: 'linear-gradient(135deg, #10B981, #059669)', soft: 'rgba(16,185,129,0.07)',  border: 'rgba(16,185,129,0.18)',  icon: '🔁', shortName: 'Repeats' },
  6: { color: '#EC4899', gradient: 'linear-gradient(135deg, #EC4899, #DB2777)', soft: 'rgba(236,72,153,0.07)',  border: 'rgba(236,72,153,0.18)',  icon: '🔄', shortName: 'Rotation' },
  7: { color: '#F59E0B', gradient: 'linear-gradient(135deg, #F59E0B, #B45309)', soft: 'rgba(245,158,11,0.07)',  border: 'rgba(245,158,11,0.18)',  icon: '🏆', shortName: 'Master Plan' },
}
const DEFAULT_LAYER_CFG = { color: '#6B7280', gradient: 'linear-gradient(135deg, #6B7280, #4B5563)', soft: 'rgba(107,114,128,0.06)', border: 'rgba(107,114,128,0.12)', icon: '📋', shortName: 'Analysis' }

/* ───────────────────────────────────────────────────
   MARKDOWN PARSING
   ─────────────────────────────────────────────────── */
function parseLayerNumber(heading: string): number | null {
  const match = heading.match(/LAYER\s*(\d)/i)
  return match ? parseInt(match[1]) : null
}

function splitMarkdownIntoSections(md: string): Section[] {
  const sections: Section[] = []
  const lines = md.split('\n')
  let currentHeading: string | null = null
  let currentContent: string[] = []

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentHeading !== null) {
        sections.push({
          heading: currentHeading,
          content: currentContent.join('\n').trim(),
          layerNum: parseLayerNumber(currentHeading),
        })
      }
      currentHeading = line.replace(/^##\s*/, '')
      currentContent = []
    } else {
      currentContent.push(line)
    }
  }
  if (currentHeading !== null) {
    sections.push({
      heading: currentHeading,
      content: currentContent.join('\n').trim(),
      layerNum: parseLayerNumber(currentHeading),
    })
  }

  return sections
}

/* ───────────────────────────────────────────────────
   SUMMARY STATS (parsed from Layer 7)
   ─────────────────────────────────────────────────── */
interface SummaryStats {
  mustStudy: number
  lightPrep: number
  glance: number
  skip: number
  coverage: string
}

function parseSummaryStats(sections: Section[]): SummaryStats | null {
  const layer7 = sections.find(s => s.layerNum === 7)
  if (!layer7) return null

  try {
    const c = layer7.content

    const getBlock = (startText: string, endText: string) => {
      const start = c.indexOf(startText)
      if (start === -1) return ''
      const end = c.indexOf(endText, start)
      return end === -1 ? c.substring(start) : c.substring(start, end)
    }

    const countCheckboxes = (text: string) => {
      return (text.match(/-\s*\[[\sXx]?\]/g) || []).length
    }

    const mustBlock = getBlock('PREPARE FULLY', 'PREPARE LIGHTLY')
    const lightBlock = getBlock('PREPARE LIGHTLY', 'GLANCE ONLY')
    const glanceBlock = getBlock('GLANCE ONLY', 'DO NOT TOUCH')
    const skipBlock = getBlock('DO NOT TOUCH', '80% Safety Calculator')

    const must = countCheckboxes(mustBlock)
    const light = countCheckboxes(lightBlock)
    const glance = countCheckboxes(glanceBlock)
    const skip = countCheckboxes(skipBlock)

    let coverage = '—'
    const lines = c.split('\n')
    for (const line of lines) {
      if (line.includes('TOTAL SECURED')) {
        const percentMatch = line.match(/(\d+(?:\.\d+)?)\s*%/)
        if (percentMatch) {
          coverage = percentMatch[1] + '%'
        }
        break
      }
    }
    if (coverage === '—') {
      const fallbackMatch = c.match(/secures\s*(\d+(?:\.\d+)?)\s*%/i)
      if (fallbackMatch) coverage = fallbackMatch[1] + '%'
    }

    if (must === 0 && light === 0 && glance === 0 && skip === 0) return null

    return { mustStudy: must, lightPrep: light, glance, skip, coverage }
  } catch {
    return null
  }
}

/* ───────────────────────────────────────────────────
   KANBAN CARD
   ─────────────────────────────────────────────────── */
function GridCard({ section, index, onExpand }: {
  section: Section
  index: number
  onExpand: () => void
}) {
  const cfg = section.layerNum
    ? LAYER_CONFIG[section.layerNum] || DEFAULT_LAYER_CFG
    : DEFAULT_LAYER_CFG
  const isMaster = section.layerNum === 7

  return (
    <div
      onClick={onExpand}
      className="grid-card animate-fade-rise cursor-pointer"
      style={{
        animationDelay: `${Math.min(index * 0.07, 0.5)}s`,
        opacity: 0,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '20px',
        background: '#fff',
        border: `1px solid ${cfg.border}`,
        boxShadow: isMaster
          ? `0 8px 40px rgba(0,0,0,0.08), 0 0 0 2px ${cfg.border}`
          : '0 2px 16px rgba(0,0,0,0.04)',
        overflow: 'hidden',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.08)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.boxShadow = isMaster
          ? `0 8px 40px rgba(0,0,0,0.08), 0 0 0 2px ${cfg.border}`
          : '0 2px 16px rgba(0,0,0,0.04)'
      }}
    >
      {/* ── Colored Header ── */}
      <div style={{
        background: cfg.gradient,
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem',
        position: 'relative',
      }}>
        <span style={{ fontSize: '1.4rem', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}>{cfg.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: '0.6rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'rgba(255,255,255,0.7)',
            margin: 0,
            fontFamily: "'Inter', sans-serif",
          }}>
            {section.layerNum ? `Layer ${section.layerNum}` : 'Overview'}
          </p>
          <p style={{
            fontSize: '0.88rem',
            fontWeight: 600,
            color: '#fff',
            margin: '0.1rem 0 0',
            fontFamily: "'Inter', sans-serif",
            letterSpacing: '-0.2px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {cfg.shortName}
          </p>
        </div>
        {isMaster && (
          <span style={{
            fontSize: '0.55rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#fff',
            background: 'rgba(255,255,255,0.2)',
            padding: '0.2rem 0.55rem',
            borderRadius: '999px',
            backdropFilter: 'blur(4px)',
            fontFamily: "'Inter', sans-serif",
          }}>
            ★ Start Here
          </span>
        )}
      </div>

      {/* ── Content preview ── */}
      <div
        className="kanban-card-body markdown-content"
        style={{
          padding: '1rem 1.25rem',
          fontSize: '0.78rem',
          color: '#444',
          lineHeight: 1.65,
          fontFamily: "'Inter', sans-serif",
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
          maxHeight: '420px',
        }}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{section.content}</ReactMarkdown>
        {/* Gradient fade at bottom */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '80px',
          background: 'linear-gradient(transparent, #fff)',
          pointerEvents: 'none',
        }} />
      </div>

      <div style={{
        padding: '0.65rem 1.25rem 1rem',
        borderTop: '1px solid rgba(0,0,0,0.04)',
        background: cfg.soft,
        color: cfg.color,
        fontSize: '0.75rem',
        fontWeight: 600,
        fontFamily: "'Inter', sans-serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.4rem',
      }}>
        Click to Expand
      </div>
    </div>
  )
}

/* ───────────────────────────────────────────────────
   EXPANDED MODAL OVERLAY
   ─────────────────────────────────────────────────── */
function ExpandedModal({ section, onClose }: {
  section: Section
  onClose: () => void
}) {
  const cfg = section.layerNum
    ? LAYER_CONFIG[section.layerNum] || DEFAULT_LAYER_CFG
    : DEFAULT_LAYER_CFG
  const overlayRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        animation: 'modal-in 0.25s ease-out',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '900px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 80px rgba(0,0,0,0.2)',
          animation: 'modal-card-in 0.3s ease-out',
        }}
      >
        {/* Header */}
        <div style={{
          background: cfg.gradient,
          padding: '1.25rem 1.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: '1.6rem' }}>{cfg.icon}</span>
          <div style={{ flex: 1 }}>
            <p style={{
              fontSize: '0.6rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'rgba(255,255,255,0.7)',
              margin: 0,
              fontFamily: "'Inter', sans-serif",
            }}>
              {section.layerNum ? `Layer ${section.layerNum}` : 'Overview'}
            </p>
            <h2 style={{
              fontSize: '1.2rem',
              fontWeight: 600,
              color: '#fff',
              margin: '0.1rem 0 0',
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '-0.3px',
            }}>
              {section.heading}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              border: 'none',
              background: 'rgba(255,255,255,0.15)',
              color: '#fff',
              fontSize: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)',
              transition: 'background 0.2s',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)' }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div
          className="markdown-content"
          style={{
            padding: '1.5rem 2rem 2rem',
            fontSize: '0.84rem',
            color: '#333',
            lineHeight: 1.7,
            fontFamily: "'Inter', sans-serif",
            overflowY: 'auto',
            flex: 1,
          }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{section.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────────────────────────────────
   STAT CARD
   ─────────────────────────────────────────────────── */
function StatCard({ label, value, color, icon, delay }: {
  label: string; value: string | number; color: string; icon: string; delay: string
}) {
  return (
    <div
      className="animate-fade-rise"
      style={{
        padding: '1.25rem 1rem',
        borderRadius: '18px',
        background: '#fff',
        borderLeft: `3px solid ${color}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.03), 0 6px 24px rgba(0,0,0,0.03)',
        opacity: 0,
        animationDelay: delay,
      }}
    >
      <p style={{
        fontSize: '0.6rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color,
        marginBottom: '0.5rem',
      }}>
        {icon} {label}
      </p>
      <p style={{
        fontSize: '1.75rem',
        fontWeight: 800,
        color: '#111',
        fontFamily: "'Inter', sans-serif",
        lineHeight: 1,
      }}>
        {value}
      </p>
    </div>
  )
}

/* ───────────────────────────────────────────────────
   MAIN COMPONENT
   ─────────────────────────────────────────────────── */
export default function AnalysisResults({ markdown, onReset }: AnalysisResultsProps) {
  const sections = useMemo(() => splitMarkdownIntoSections(markdown), [markdown])
  const summary = useMemo(() => parseSummaryStats(sections), [sections])
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Reorder: Layer 7 first
  const orderedSections = useMemo(() => {
    const layer7Index = sections.findIndex(s => s.layerNum === 7)
    if (layer7Index <= 0) return sections
    const reordered = [...sections]
    const [layer7] = reordered.splice(layer7Index, 1)
    reordered.unshift(layer7)
    return reordered
  }, [sections])

  // Horizontal scroll with mouse wheel
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault()
        el.scrollLeft += e.deltaY
      }
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  // Fallback: no sections — render raw markdown
  if (sections.length === 0) {
    return (
      <div className="min-h-screen" style={{ background: '#fafafa' }}>
        <Navbar />
        <main className="page-enter" style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 className="font-display" style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              lineHeight: 1.1,
              letterSpacing: '-1.5px',
              color: '#000',
              fontWeight: 400,
            }}>
              Your Exam{' '}
              <em style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block',
                paddingBottom: '0.15em',
                paddingRight: '0.1em',
              }}>Strategy</em>
            </h1>
          </div>
          <div
            className="markdown-content"
            style={{
              padding: '2rem',
              borderRadius: '18px',
              background: '#fff',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
              fontSize: '0.84rem',
              color: '#333',
              lineHeight: 1.7,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
          </div>
          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <button
              onClick={onReset}
              className="cursor-pointer transition-all duration-200 hover:scale-[1.03]"
              style={{
                backgroundColor: '#000',
                color: '#fff',
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.9rem',
                fontWeight: 500,
                padding: '0.85rem 2.5rem',
                borderRadius: '9999px',
                border: 'none',
              }}
            >
              Analyze Another PDF
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#f8f9fb' }}>
      <Navbar />

      <main className="page-enter" style={{
        padding: 'clamp(1rem, 3vw, 2rem) 0 3rem',
      }}>
        {/* ── Header area (centered, constrained) ── */}
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 clamp(1rem, 4vw, 2rem)' }}>
          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h1 className="font-display" style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              lineHeight: 1.1,
              letterSpacing: '-1.5px',
              color: '#000',
              fontWeight: 400,
            }}>
              Your Exam{' '}
              <em style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block',
                paddingBottom: '0.15em',
                paddingRight: '0.1em',
              }}>Strategy</em>
            </h1>
            <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.5rem', fontFamily: "'Inter', sans-serif" }}>
              7-layer deep analysis · click on any tile to expand and read
            </p>
            <button
              onClick={onReset}
              className="cursor-pointer transition-all duration-200 hover:scale-[1.03]"
              style={{
                marginTop: '1rem',
                color: '#000',
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.8rem',
                fontWeight: 500,
                border: '1px solid rgba(0, 0, 0, 0.15)',
                padding: '0.5rem 1.5rem',
                borderRadius: '9999px',
                background: 'transparent',
              }}
            >
              ← Analyze Another PDF
            </button>
          </div>

          {/* ── Summary Stats ── */}
          {summary && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '0.75rem',
              marginBottom: '1.25rem',
              maxWidth: '900px',
              margin: '0 auto 1.25rem',
            }}>
              <StatCard label="Must Study" value={summary.mustStudy} color="#EF4444" icon="🔴" delay="0s" />
              <StatCard label="Light Prep" value={summary.lightPrep} color="#F59E0B" icon="🟡" delay="0.06s" />
              <StatCard label="Glance Only" value={summary.glance} color="#6366F1" icon="⚡" delay="0.12s" />
              <StatCard label="Est. Coverage" value={summary.coverage} color="#10B981" icon="📊" delay="0.18s" />
            </div>
          )}

          {/* ── Focus Banner ── */}
          <div className="animate-fade-rise-delay" style={{
            padding: '0.75rem 1.25rem',
            borderRadius: '14px',
            marginBottom: '1.25rem',
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            maxWidth: '900px',
            margin: '0 auto 1.25rem',
          }}>
            <span style={{ fontSize: '1.15rem' }}>🎯</span>
            <p style={{ fontSize: '0.78rem', fontWeight: 500, color: '#fff', lineHeight: 1.4, margin: 0 }}>
              <strong>Layer 7 is first</strong> — your master action plan. Click any layer below to explore in detail.
            </p>
          </div>
        </div>

        {/* ── Grid Board ── */}
        <div
          className="grid-board"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem',
            padding: '0.5rem clamp(1rem, 4vw, 2rem) 1.5rem',
            maxWidth: '1400px',
            margin: '0 auto',
          }}
        >
          {orderedSections.map((s, i) => (
            <GridCard
              key={i}
              section={s}
              index={i}
              onExpand={() => setExpandedIdx(i)}
            />
          ))}
        </div>

        {/* ── Footer Legend (centered, constrained) ── */}
        <div style={{ maxWidth: '900px', margin: '2rem auto 0', padding: '0 clamp(1rem, 4vw, 2rem)' }}>
          <div style={{
            padding: '1.25rem 1.5rem',
            borderRadius: '16px',
            background: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            border: '1px solid rgba(0,0,0,0.04)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1.25rem',
          }}>
            {[
              { emoji: '🔴', title: 'Must Study', desc: 'High repetition. Very likely to appear. Full prep required.' },
              { emoji: '🟡', title: 'Light Prep', desc: 'Moderate chance. Practice 2 questions max per topic.' },
              { emoji: '⚡', title: 'Glance Only', desc: 'Low chance. Skim definitions and formulas only.' },
              { emoji: '🗑️', title: 'Skip', desc: 'Zero ROI. Never appeared or fully faded.' },
            ].map((l, i) => (
              <div key={i}>
                <p style={{ fontSize: '1rem', marginBottom: '0.15rem' }}>{l.emoji}</p>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#333', marginBottom: '0.2rem' }}>{l.title}</p>
                <p style={{ fontSize: '0.68rem', color: '#aaa', lineHeight: 1.5 }}>{l.desc}</p>
              </div>
            ))}
          </div>

          {/* ── Bottom CTA ── */}
          <div style={{ textAlign: 'center', marginTop: '2.5rem', paddingBottom: '2rem' }}>
            <button
              onClick={onReset}
              className="cursor-pointer transition-all duration-200 hover:scale-[1.03]"
              style={{
                backgroundColor: '#000',
                color: '#fff',
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.9rem',
                fontWeight: 500,
                padding: '0.85rem 2.5rem',
                borderRadius: '9999px',
                border: 'none',
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
              }}
            >
              Analyze Another PDF
            </button>
          </div>
        </div>
      </main>

      {/* ── Expanded Modal ── */}
      {expandedIdx !== null && (
        <ExpandedModal
          section={orderedSections[expandedIdx]}
          onClose={() => setExpandedIdx(null)}
        />
      )}
    </div>
  )
}
