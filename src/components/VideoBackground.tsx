import { useEffect, useRef } from 'react'

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_083109_283f3553-e28f-428b-a723-d639c617eb2b.mp4'

export default function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let rafId: number

    const monitorLoop = () => {
      if (!video.duration || video.paused) {
        rafId = requestAnimationFrame(monitorLoop)
        return
      }

      const { currentTime, duration } = video

      // Fade in over 0.5s at start
      if (currentTime < 0.5) {
        video.style.opacity = String(currentTime / 0.5)
      }
      // Fade out 0.5s before end
      else if (currentTime > duration - 0.5) {
        video.style.opacity = String((duration - currentTime) / 0.5)
      }
      // Full opacity in between
      else {
        video.style.opacity = '1'
      }

      rafId = requestAnimationFrame(monitorLoop)
    }

    const handleEnded = () => {
      video.style.opacity = '0'
      setTimeout(() => {
        video.currentTime = 0
        video.play().catch(() => {})
      }, 100)
    }

    video.addEventListener('ended', handleEnded)
    video.style.opacity = '0'
    video.play().catch(() => {})
    rafId = requestAnimationFrame(monitorLoop)

    return () => {
      cancelAnimationFrame(rafId)
      video.removeEventListener('ended', handleEnded)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="absolute z-0 overflow-hidden"
      style={{ top: '300px', inset: 'auto 0 0 0' }}
    >
      <video
        ref={videoRef}
        src={VIDEO_URL}
        muted
        playsInline
        className="w-full h-full object-cover"
        style={{ opacity: 0, transition: 'none' }}
      />
      {/* Gradient overlays */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, #FFFFFF 0%, transparent 30%, transparent 70%, #FFFFFF 100%)',
        }}
      />
    </div>
  )
}
