'use client'

import { useState, useCallback } from 'react'
import DropZone from '@/components/DropZone'

type AppState = 'idle' | 'loading' | 'result' | 'error'

interface AnalysisResult {
  ocr: string
  analysis: string
  summary: string
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
        backgroundColor: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <span style={{
          fontSize: '11px',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          {title}
        </span>
        <button
          onClick={handleCopy}
          style={{
            background: 'none',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: '6px',
            color: copied ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)',
            fontSize: '11px',
            cursor: 'pointer',
            padding: '4px 10px',
            transition: 'color 0.15s, border-color 0.15s',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          {copied ? (
            <>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Copied
            </>
          ) : (
            <>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <rect x="4" y="1" width="7" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                <rect x="1" y="3" width="7" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>

      <div
        style={{
          padding: '18px',
          maxHeight: mono ? '260px' : 'none',
          overflowY: mono ? 'auto' : 'visible',
        }}
      >
        {content ? (
          <p
            style={{
              fontSize: '14px',
              lineHeight: '1.75',
              color: 'rgba(255,255,255,0.72)',
              whiteSpace: 'pre-wrap',
              fontFamily: mono
                ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
                : 'inherit',
            }}
          >
            {content}
          </p>
        ) : (
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>
            No text detected.
          </p>
        )}
      </div>
    </div>
  )
}

export default function HomePage() {
  const [state, setState] = useState<AppState>('idle')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const handleAnalyze = useCallback(async (file: File) => {
    setState('loading')
    setResult(null)
    setErrorMessage('')

    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setErrorMessage(data.error || 'Something went wrong. Please try again.')
        setState('error')
        return
      }

      setResult(data)
      setState('result')
    } catch {
      setErrorMessage('Network error. Please check your connection and try again.')
      setState('error')
    }
  }, [])

  const handleReset = () => {
    setState('idle')
    setResult(null)
    setErrorMessage('')
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#1a1a1a',
        padding: '48px 20px 80px',
        position: 'relative',
      }}
    >
      {/* Ambient orb — background glow, no lines */}
      <div
        style={{
          position: 'fixed',
          top: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '400px',
          background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 50%, transparent 75%)',
          pointerEvents: 'none',
          zIndex: 0,
          filter: 'blur(40px)',
        }}
      />

      <div style={{ maxWidth: '640px', margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ marginBottom: '48px', textAlign: 'center' }}>
          <p style={{
            fontSize: '11px',
            color: 'rgba(255,255,255,0.25)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginBottom: '12px',
          }}>
            Claude Vision
          </p>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.90)',
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
          }}>
            Image Analyzer
          </h1>
          <p style={{
            fontSize: '15px',
            color: 'rgba(255,255,255,0.30)',
            lineHeight: 1.6,
            marginTop: '10px',
          }}>
            Drop a screenshot to extract text, analyze content, and summarize.
          </p>
        </div>

        {/* Idle / Loading — show drop zone */}
        {(state === 'idle' || state === 'loading') && (
          <DropZone onAnalyze={handleAnalyze} disabled={state === 'loading'} />
        )}

        {/* Loading indicator */}
        {state === 'loading' && (
          <div
            style={{
              marginTop: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              color: 'rgba(255,255,255,0.35)',
              fontSize: '13px',
            }}
          >
            {/* Pulsing orb spinner — no lines */}
            <div
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 38% 36%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.3) 50%, transparent 70%)',
                boxShadow: '0 0 12px 4px rgba(255,255,255,0.15)',
                animation: 'pulse 1.4s ease-in-out infinite',
                flexShrink: 0,
              }}
            />
            <style>{`
              @keyframes pulse {
                0%, 100% { opacity: 0.4; transform: scale(0.9); }
                50% { opacity: 1; transform: scale(1.1); }
              }
            `}</style>
            Analyzing with Claude...
          </div>
        )}

        {/* Error */}
        {state === 'error' && (
          <div>
            <div
              style={{
                backgroundColor: 'rgba(255,80,80,0.06)',
                border: '1px solid rgba(255,80,80,0.15)',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '16px',
              }}
            >
              <p style={{ color: 'rgba(255,120,120,0.9)', fontSize: '14px', marginBottom: '4px', fontWeight: 500 }}>
                Analysis failed
              </p>
              <p style={{ color: 'rgba(255,120,120,0.5)', fontSize: '13px' }}>{errorMessage}</p>
            </div>
            <button
              onClick={handleReset}
              style={{
                width: '100%',
                padding: '13px',
                backgroundColor: 'transparent',
                color: 'rgba(255,255,255,0.6)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.20)'
                e.currentTarget.style.color = '#ffffff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'
                e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
              }}
            >
              Try again
            </button>
          </div>
        )}

        {/* Results */}
        {state === 'result' && result && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <ResultCard title="Extracted Text" content={result.ocr} mono />
              <ResultCard title="Analysis" content={result.analysis} />
              <ResultCard title="Summary" content={result.summary} />
            </div>

            <button
              onClick={handleReset}
              style={{
                width: '100%',
                padding: '13px',
                backgroundColor: 'transparent',
                color: 'rgba(255,255,255,0.3)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                e.currentTarget.style.color = 'rgba(255,255,255,0.3)'
              }}
            >
              Analyze another image
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
