'use client'

import { useState, useCallback } from 'react'
import DropZone from '@/components/DropZone'

interface AnalysisResult {
  ocr: string
  analysis: string
  summary: string
}

interface ImageResult {
  file: File
  preview: string
  result: AnalysisResult | null
  error: string | null
  status: 'pending' | 'analyzing' | 'done' | 'error'
}

interface ResultCardProps {
  title: string
  content: string
  mono?: boolean
}

function ResultCard({ title, content, mono }: ResultCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      style={{
        backgroundColor: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {title}
        </span>
        <button
          onClick={handleCopy}
          style={{
            background: 'none',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: '7px',
            color: copied ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)',
            fontSize: '12px',
            cursor: 'pointer',
            padding: '6px 12px',
            minHeight: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <div
        style={{
          padding: '14px',
          maxHeight: mono ? '200px' : 'none',
          overflowY: mono ? 'auto' : 'visible',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {content ? (
          <p style={{
            fontSize: '14px',
            lineHeight: '1.75',
            color: 'rgba(255,255,255,0.68)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontFamily: mono ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' : 'inherit',
          }}>
            {content}
          </p>
        ) : (
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>No text detected.</p>
        )}
      </div>
    </div>
  )
}

function ImageResultCard({ item, index }: { item: ImageResult; index: number }) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div
      style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        overflow: 'hidden',
      }}
    >
      {/* Image header row */}
      <button
        onClick={() => item.status === 'done' && setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 16px',
          background: 'none',
          border: 'none',
          borderBottom: expanded && item.status === 'done' ? '1px solid rgba(255,255,255,0.06)' : 'none',
          cursor: item.status === 'done' ? 'pointer' : 'default',
          textAlign: 'left',
        }}
      >
        {/* Thumbnail */}
        <div style={{ width: '44px', height: '44px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        {/* Name + status */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: 'rgba(255,255,255,0.80)', fontSize: '14px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {index + 1}. {item.file.name}
          </p>
          <p style={{ color: statusColor(item.status), fontSize: '12px', marginTop: '2px' }}>
            {statusLabel(item.status)}
          </p>
        </div>

        {/* Chevron */}
        {item.status === 'done' && (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            <path d="M4 6L8 10L12 6" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}

        {/* Spinner */}
        {item.status === 'analyzing' && (
          <div style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 38% 36%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.3) 50%, transparent 70%)',
            boxShadow: '0 0 10px 3px rgba(255,255,255,0.12)',
            animation: 'pulse 1.4s ease-in-out infinite',
            flexShrink: 0,
          }} />
        )}
      </button>

      {/* Results */}
      {expanded && item.status === 'done' && item.result && (
        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <ResultCard title="Extracted Text" content={item.result.ocr} mono />
          <ResultCard title="Analysis" content={item.result.analysis} />
          <ResultCard title="Summary" content={item.result.summary} />
        </div>
      )}

      {/* Error */}
      {item.status === 'error' && item.error && (
        <div style={{ padding: '14px' }}>
          <p style={{ color: 'rgba(255,100,100,0.7)', fontSize: '13px' }}>{item.error}</p>
        </div>
      )}
    </div>
  )
}

function statusLabel(status: ImageResult['status']): string {
  switch (status) {
    case 'pending': return 'Waiting...'
    case 'analyzing': return 'Analyzing...'
    case 'done': return 'Done'
    case 'error': return 'Failed'
  }
}

function statusColor(status: ImageResult['status']): string {
  switch (status) {
    case 'pending': return 'rgba(255,255,255,0.20)'
    case 'analyzing': return 'rgba(255,255,255,0.50)'
    case 'done': return 'rgba(160,220,160,0.70)'
    case 'error': return 'rgba(255,100,100,0.60)'
  }
}

type AppState = 'idle' | 'analyzing' | 'done'

export default function HomePage() {
  const [appState, setAppState] = useState<AppState>('idle')
  const [imageResults, setImageResults] = useState<ImageResult[]>([])
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  const handleAnalyze = useCallback(async (files: File[]) => {
    // Build initial state with previews
    const initial: ImageResult[] = await Promise.all(
      files.map((file) =>
        new Promise<ImageResult>((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) =>
            resolve({ file, preview: e.target?.result as string, result: null, error: null, status: 'pending' })
          reader.readAsDataURL(file)
        })
      )
    )

    setImageResults(initial)
    setAppState('analyzing')
    setProgress({ current: 0, total: files.length })

    // Process sequentially
    for (let i = 0; i < files.length; i++) {
      setProgress({ current: i + 1, total: files.length })

      // Mark as analyzing
      setImageResults((prev) => {
        const next = [...prev]
        next[i] = { ...next[i], status: 'analyzing' }
        return next
      })

      try {
        const formData = new FormData()
        formData.append('image', files[i])
        const response = await fetch('/api/analyze', { method: 'POST', body: formData })
        const data = await response.json()

        if (!response.ok) {
          setImageResults((prev) => {
            const next = [...prev]
            next[i] = { ...next[i], status: 'error', error: data.error || 'Analysis failed' }
            return next
          })
        } else {
          setImageResults((prev) => {
            const next = [...prev]
            next[i] = { ...next[i], status: 'done', result: data }
            return next
          })
        }
      } catch {
        setImageResults((prev) => {
          const next = [...prev]
          next[i] = { ...next[i], status: 'error', error: 'Network error' }
          return next
        })
      }
    }

    setAppState('done')
  }, [])

  const handleReset = () => {
    setAppState('idle')
    setImageResults([])
    setProgress({ current: 0, total: 0 })
  }

  return (
    <main
      style={{
        minHeight: '100dvh',
        backgroundColor: '#1a1a1a',
        padding: 'env(safe-area-inset-top, 0px) 0 calc(env(safe-area-inset-bottom, 0px) + 40px)',
        position: 'relative',
      } as React.CSSProperties}
    >
      {/* Ambient orb */}
      <div style={{
        position: 'fixed', top: '10%', left: '50%', transform: 'translateX(-50%)',
        width: '100vw', maxWidth: '600px', height: '400px',
        background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 50%, transparent 75%)',
        pointerEvents: 'none', zIndex: 0, filter: 'blur(40px)',
      }} />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.88); }
          50% { opacity: 1; transform: scale(1.12); }
        }
      `}</style>

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '40px 20px 0', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.22)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '10px' }}>
            Claude Vision
          </p>
          <h1 style={{ fontSize: '28px', fontWeight: 600, color: 'rgba(255,255,255,0.90)', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
            Screenshot KB
          </h1>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.28)', lineHeight: 1.6, marginTop: '8px' }}>
            Upload one or many photos for instant OCR, analysis, and summary.
          </p>
        </div>

        {/* Upload state */}
        {appState === 'idle' && (
          <DropZone onAnalyze={handleAnalyze} disabled={false} />
        )}

        {/* Analyzing / done state */}
        {(appState === 'analyzing' || appState === 'done') && (
          <div>
            {/* Progress bar */}
            {appState === 'analyzing' && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.40)' }}>
                    Analyzing {progress.current} of {progress.total}...
                  </span>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)' }}>
                    {Math.round((progress.current / progress.total) * 100)}%
                  </span>
                </div>
                <div style={{ height: '2px', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    backgroundColor: 'rgba(255,255,255,0.5)',
                    borderRadius: '2px',
                    width: `${(progress.current / progress.total) * 100}%`,
                    transition: 'width 0.4s ease',
                  }} />
                </div>
              </div>
            )}

            {/* Per-image result cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {imageResults.map((item, i) => (
                <ImageResultCard key={i} item={item} index={i} />
              ))}
            </div>

            {/* Analyze more button — only shown when done */}
            {appState === 'done' && (
              <button
                onClick={handleReset}
                style={{
                  width: '100%',
                  padding: '18px',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  color: 'rgba(255,255,255,0.5)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px',
                  fontSize: '16px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  minHeight: '56px',
                }}
              >
                Analyze more photos
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
