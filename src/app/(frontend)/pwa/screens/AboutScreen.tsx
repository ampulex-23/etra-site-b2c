'use client'

import React, { useRef, useState, useEffect } from 'react'
import Link from 'next/link'

export function AboutScreen() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [ended, setEnded] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onEnded = () => setEnded(true)
    const onLoaded = () => setLoaded(true)
    v.addEventListener('ended', onEnded)
    v.addEventListener('loadeddata', onLoaded)
    return () => {
      v.removeEventListener('ended', onEnded)
      v.removeEventListener('loadeddata', onLoaded)
    }
  }, [])

  return (
    <div className="pwa-screen pwa-screen--flush">
      <div className="hero-video-wrap">
        {/* Video / static fallback */}
        {!ended && (
          <video
            ref={videoRef}
            className="hero-video"
            src="/images/video.mp4"
            autoPlay
            muted
            playsInline
            preload="auto"
            style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.6s' }}
          />
        )}
        {ended && (
          <img
            src="/images/bg.jpg"
            alt=""
            className="hero-video"
            style={{ objectFit: 'cover' }}
          />
        )}

        <div className="hero-video-overlay" />

        <div className="hero-content animate-in">
          <img
            src="/images/logo.png"
            alt="ЭТРА"
            style={{ height: 48, margin: '0 auto 20px', filter: 'brightness(1.2)' }}
          />
          <h1 className="t-h1" style={{ marginBottom: 10 }}>
            Живые ферменты
          </h1>
          <p className="t-body t-sec" style={{ marginBottom: 28, maxWidth: 300, marginInline: 'auto' }}>
            Натуральная ферментация и пробиотики в каждой бутылке. Наука на службе вкуса.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/catalog" className="btn btn--primary">
              Каталог
            </Link>
            <Link href="/recipes" className="btn btn--glass">
              Рецепты
            </Link>
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div style={{ padding: 16 }}>
        <div className="stack">
          <InfoCard
            icon={
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="var(--c-primary)" strokeWidth="1.5">
                <path d="M12 2a7 7 0 017 7c0 5-7 13-7 13S5 14 5 9a7 7 0 017-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
            }
            title="Натуральные ингредиенты"
            desc="Только органическое сырьё, без консервантов и красителей. Каждая партия проходит лабораторный контроль."
          />
          <InfoCard
            icon={
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="var(--c-accent)" strokeWidth="1.5">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            }
            title="Живые пробиотики"
            desc="Миллиарды полезных бактерий в каждой бутылке. Поддерживают микробиом и укрепляют иммунитет."
          />
          <InfoCard
            icon={
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="var(--c-accent-violet)" strokeWidth="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            }
            title="Научный подход"
            desc="Технология ферментации разработана в сотрудничестве с ведущими микробиологами."
          />
        </div>
      </div>
    </div>
  )
}

function InfoCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="glass" style={{ padding: 18, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <div style={{ flexShrink: 0, marginTop: 2 }}>{icon}</div>
      <div>
        <div className="t-h3" style={{ marginBottom: 4 }}>{title}</div>
        <div className="t-caption t-sec">{desc}</div>
      </div>
    </div>
  )
}
