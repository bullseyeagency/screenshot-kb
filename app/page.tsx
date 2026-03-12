'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import DropZone from '@/components/DropZone'
import { Screenshot } from '@/lib/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + '…' : str
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Screenshot['status'] }) {
  const styles: Record<Screenshot['status'], React.CSSProperties> = {
    inbox: {
      backgroundColor: 'rgba(255,255,255,0.12)',
      color: 'rgba(255,255,255,0.75)',
    },
    analyzing: {
      backgroundColor: 'rgba(255,200,80,0.15)',
      color: 'rgba(255,200,80,0.9)',
    },
    analyzed: {
      backgroundColor: 'rgba(100,220,130,0.12)',
      color: 'rgba(100,220,130,0.85)',
    },
    archived: {
      backgroundColor: 'rgba(255,255,255,0.06)',
      color: 'rgba(255,255,255,0.30)',
    },
  }

  const labels: Record<Screenshot['status'], string> = {
    inbox: 'Inbox',
    analyzing: 'Analyzing...',
    analyzed: 'Analyzed',
    archived: 'Archived',
  }

  return (
    <span
      className={status === 'analyzing' ? 'badge-analyzing' : ''}
      style={{
        ...styles[status],
        padding: '3px 8px',
        borderRadius: '100px',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      {labels[status]}
    </span>
  )
}

// ─── Chip ─────────────────────────────────────────────────────────────────────

function Chip({ label }: { label: string }) {
  return <span className="chip">{label}</span>
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

interface DetailPanelProps {
  screenshot: Screenshot
  onClose: () => void
  onDelete: (id: string) => void
}

function DetailPanel({ screenshot, onClose, onDelete }: DetailPanelProps) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Delete this screenshot?')) return
    setDeleting(true)
    try {
      await fetch(`/api/screenshots/${screenshot.id}`, { method: 'DELETE' })
      onDelete(screenshot.id)
      onClose()
    } catch {
      setDeleting(false)
    }
  }

  const hasMetadata = screenshot.status === 'analyzed'

  return (
    <>
      {/* Backdrop */}
      <div className="overlay-backdrop" onClick={onClose} />

      {/* Panel — full screen on mobile, right slide-in on desktop */}
      <div
        className="panel-slide-in"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '480px',
          backgroundColor: '#1f1f1f',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          zIndex: 60,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)',
        }}
      >
        {/* Header */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            backgroundColor: '#1f1f1f',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 1,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {screenshot.filename}
            </p>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.30)', marginTop: '2px' }}>
              {formatDate(screenshot.uploaded_at)}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '12px', flexShrink: 0 }}>
            <StatusBadge status={screenshot.status} />
            <button
              onClick={onClose}
              style={{
                background: 'none', border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: '8px', color: 'rgba(255,255,255,0.45)',
                fontSize: '18px', cursor: 'pointer',
                width: '34px', height: '34px', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Image */}
        <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center', maxHeight: '360px', overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={screenshot.url}
            alt={screenshot.filename}
            style={{ width: '100%', maxHeight: '360px', objectFit: 'contain' }}
          />
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Not yet analyzed */}
          {!hasMetadata && screenshot.status !== 'analyzing' && (
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
            }}>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px' }}>
                This screenshot has not been analyzed yet.
              </p>
              <p style={{ color: 'rgba(255,255,255,0.20)', fontSize: '13px', marginTop: '4px' }}>
                Select it in the gallery and tap Analyze.
              </p>
            </div>
          )}

          {screenshot.status === 'analyzing' && (
            <div style={{
              backgroundColor: 'rgba(255,200,80,0.06)',
              border: '1px solid rgba(255,200,80,0.12)',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
            }}>
              <p className="badge-analyzing" style={{ color: 'rgba(255,200,80,0.8)', fontSize: '14px' }}>
                Analysis in progress...
              </p>
            </div>
          )}

          {/* Summary */}
          {screenshot.summary && (
            <div>
              <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.30)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
                Summary
              </p>
              <p style={{ fontSize: '15px', lineHeight: '1.7', color: 'rgba(255,255,255,0.80)', fontWeight: 400 }}>
                {screenshot.summary}
              </p>
            </div>
          )}

          {/* Content type + source */}
          {(screenshot.content_type || screenshot.source_hint) && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {screenshot.content_type && (
                <span style={{
                  padding: '5px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 600,
                  backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.70)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}>
                  {screenshot.content_type}
                </span>
              )}
              {screenshot.source_hint && (
                <span style={{
                  padding: '5px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 500,
                  backgroundColor: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.40)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}>
                  {screenshot.source_hint}
                </span>
              )}
            </div>
          )}

          {/* Analysis */}
          {screenshot.analysis && (
            <div>
              <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.30)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
                Analysis
              </p>
              <p style={{ fontSize: '14px', lineHeight: '1.75', color: 'rgba(255,255,255,0.60)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {screenshot.analysis}
              </p>
            </div>
          )}

          {/* OCR */}
          {screenshot.ocr && (
            <div>
              <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.30)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
                Extracted Text
              </p>
              <div style={{
                backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '10px', padding: '14px',
                maxHeight: '200px', overflowY: 'auto',
              }}>
                <p style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  fontSize: '13px', lineHeight: '1.65', color: 'rgba(255,255,255,0.55)',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                  {screenshot.ocr}
                </p>
              </div>
            </div>
          )}

          {/* Tags + Categories */}
          {((screenshot.tags && screenshot.tags.length > 0) || (screenshot.categories && screenshot.categories.length > 0)) && (
            <div>
              <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.30)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
                Tags &amp; Categories
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {screenshot.categories?.map((c) => (
                  <span key={c} style={{
                    padding: '4px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: 600,
                    backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.65)',
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}>
                    {c}
                  </span>
                ))}
                {screenshot.tags?.map((t) => (
                  <Chip key={t} label={t} />
                ))}
              </div>
            </div>
          )}

          {/* Topics */}
          {screenshot.topics && screenshot.topics.length > 0 && (
            <div>
              <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.30)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
                Topics
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {screenshot.topics.map((t) => <Chip key={t} label={t} />)}
              </div>
            </div>
          )}

          {/* Key Entities */}
          {screenshot.key_entities && screenshot.key_entities.length > 0 && (
            <div>
              <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.30)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
                Key Entities
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {screenshot.key_entities.map((e) => <Chip key={e} label={e} />)}
              </div>
            </div>
          )}

          {/* Action Items */}
          {screenshot.action_items && screenshot.action_items.length > 0 && (
            <div>
              <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.30)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
                Action Items
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {screenshot.action_items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      backgroundColor: 'rgba(255,255,255,0.25)',
                      marginTop: '6px', flexShrink: 0,
                    }} />
                    <p style={{ fontSize: '14px', lineHeight: '1.65', color: 'rgba(255,255,255,0.60)' }}>
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* File info */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                ['File', screenshot.filename],
                ['Type', screenshot.mime_type || '—'],
                ['Size', screenshot.file_size ? `${(screenshot.file_size / 1024).toFixed(1)} KB` : '—'],
                ['Uploaded', formatDate(screenshot.uploaded_at)],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', gap: '12px' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', width: '56px', flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', wordBreak: 'break-all' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Delete */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              width: '100%', padding: '14px',
              backgroundColor: 'rgba(255,60,60,0.08)',
              border: '1px solid rgba(255,60,60,0.18)',
              borderRadius: '12px', color: 'rgba(255,100,100,0.75)',
              fontSize: '14px', fontWeight: 500, cursor: deleting ? 'not-allowed' : 'pointer',
              opacity: deleting ? 0.5 : 1, transition: 'opacity 0.2s',
            }}
          >
            {deleting ? 'Deleting...' : 'Delete Screenshot'}
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Gallery Card ─────────────────────────────────────────────────────────────

interface GalleryCardProps {
  screenshot: Screenshot
  selected: boolean
  onToggleSelect: (id: string) => void
  onOpen: (screenshot: Screenshot) => void
}

function GalleryCard({ screenshot, selected, onToggleSelect, onOpen }: GalleryCardProps) {
  const handleCheckbox = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleSelect(screenshot.id)
  }

  return (
    <div
      className="gallery-card"
      onClick={() => onOpen(screenshot)}
      style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        border: `1px solid ${selected ? 'rgba(255,255,255,0.30)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: '16px',
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative',
        boxShadow: selected ? '0 0 0 1px rgba(255,255,255,0.18), 0 0 20px rgba(255,255,255,0.05)' : 'none',
      }}
    >
      {/* Thumbnail */}
      <div style={{ position: 'relative', paddingBottom: '66%', backgroundColor: 'rgba(0,0,0,0.2)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={screenshot.url}
          alt={screenshot.filename}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover',
          }}
        />
        {/* Checkbox overlay */}
        <div
          onClick={handleCheckbox}
          className={`custom-checkbox ${selected ? 'checked' : ''}`}
          style={{ position: 'absolute', top: '8px', left: '8px' }}
        >
          {selected && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6L5 9L10 3" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>

      {/* Card info */}
      <div style={{ padding: '10px 12px 12px' }}>
        <p style={{
          fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.70)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          marginBottom: '6px',
        }}>
          {truncate(screenshot.filename, 32)}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.22)' }}>
            {formatDate(screenshot.uploaded_at)}
          </span>
          <StatusBadge status={screenshot.status} />
        </div>
        {/* Tags preview */}
        {screenshot.tags && screenshot.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap' }}>
            {screenshot.tags.slice(0, 2).map((t) => (
              <span key={t} style={{
                fontSize: '10px', padding: '2px 7px', borderRadius: '100px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.40)',
              }}>
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────

interface UploadModalProps {
  onUpload: (screenshots: Screenshot[]) => void
  onClose: () => void
}

function UploadModal({ onUpload, onClose }: UploadModalProps) {
  return (
    <>
      <div className="overlay-backdrop" onClick={onClose} />
      <div
        className="modal-slide-up"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#222222',
          borderRadius: '20px 20px 0 0',
          border: '1px solid rgba(255,255,255,0.08)',
          borderBottom: 'none',
          zIndex: 60,
          padding: '24px 20px calc(env(safe-area-inset-bottom, 0px) + 24px)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', backgroundColor: 'rgba(255,255,255,0.12)' }} />
        </div>
        <p style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: '20px' }}>
          Upload Screenshots
        </p>
        <DropZone onUpload={onUpload} onClose={onClose} />
      </div>
    </>
  )
}

// ─── Floating Action Bar ───────────────────────────────────────────────────────

interface FloatingBarProps {
  count: number
  analyzing: boolean
  onAnalyze: () => void
  onDelete: () => void
  onClear: () => void
}

function FloatingBar({ count, analyzing, onAnalyze, onDelete, onClear }: FloatingBarProps) {
  return (
    <div
      className="fade-in"
      style={{
        position: 'fixed',
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        backgroundColor: '#2a2a2a',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '100px',
        padding: '8px 8px 8px 16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.50)' }}>
        {count} selected
      </span>
      <button
        onClick={onClear}
        style={{
          background: 'none', border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: '100px', color: 'rgba(255,255,255,0.40)',
          fontSize: '13px', cursor: 'pointer', padding: '7px 14px',
        }}
      >
        Clear
      </button>
      <button
        onClick={onDelete}
        style={{
          background: 'rgba(255,60,60,0.12)', border: '1px solid rgba(255,60,60,0.20)',
          borderRadius: '100px', color: 'rgba(255,100,100,0.80)',
          fontSize: '13px', fontWeight: 500, cursor: 'pointer', padding: '7px 14px',
        }}
      >
        Delete
      </button>
      <button
        onClick={onAnalyze}
        disabled={analyzing}
        style={{
          backgroundColor: analyzing ? 'rgba(255,255,255,0.6)' : '#ffffff',
          border: 'none', borderRadius: '100px', color: '#1a1a1a',
          fontSize: '13px', fontWeight: 600, cursor: analyzing ? 'not-allowed' : 'pointer',
          padding: '8px 18px', transition: 'background-color 0.2s',
        }}
      >
        {analyzing ? 'Analyzing...' : `Analyze ${count}`}
      </button>
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' }}>
      <div style={{
        width: '72px', height: '72px', borderRadius: '50%',
        background: 'radial-gradient(circle at 38% 36%, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.08) 45%, transparent 70%)',
        boxShadow: '0 0 24px 8px rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.10)',
        marginBottom: '24px',
      }} />
      <p style={{ fontSize: '17px', fontWeight: 500, color: 'rgba(255,255,255,0.70)', marginBottom: '8px' }}>
        No screenshots here
      </p>
      <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.28)', lineHeight: 1.6, marginBottom: '24px', maxWidth: '260px' }}>
        Upload screenshots to start building your knowledge base.
      </p>
      <button
        onClick={onUpload}
        style={{
          backgroundColor: '#ffffff', color: '#1a1a1a',
          border: 'none', borderRadius: '100px',
          fontSize: '14px', fontWeight: 600, cursor: 'pointer',
          padding: '12px 24px',
        }}
      >
        Upload Screenshots
      </button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'inbox' | 'analyzed'

export default function HomePage() {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [activeDetail, setActiveDetail] = useState<Screenshot | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [batchAnalyzing, setBatchAnalyzing] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Fetch all screenshots
  const fetchScreenshots = useCallback(async () => {
    try {
      const res = await fetch('/api/screenshots')
      const data = await res.json()
      if (data.screenshots) {
        setScreenshots(data.screenshots)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchScreenshots()
  }, [fetchScreenshots])

  // Poll when any screenshot is analyzing
  useEffect(() => {
    const hasAnalyzing = screenshots.some((s) => s.status === 'analyzing')

    if (hasAnalyzing && !pollRef.current) {
      pollRef.current = setInterval(async () => {
        const res = await fetch('/api/screenshots')
        const data = await res.json()
        if (data.screenshots) {
          setScreenshots(data.screenshots)
          // Also update active detail if it's being watched
          setActiveDetail((prev) => {
            if (!prev) return null
            const fresh = data.screenshots.find((s: Screenshot) => s.id === prev.id)
            return fresh || prev
          })
        }
      }, 3000)
    }

    if (!hasAnalyzing && pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }

    return () => {
      if (pollRef.current && !hasAnalyzing) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [screenshots])

  // Filtered list
  const filtered = screenshots.filter((s) => {
    if (filter === 'inbox') return s.status === 'inbox'
    if (filter === 'analyzed') return s.status === 'analyzed'
    return true
  })

  // Tab counts
  const counts = {
    all: screenshots.length,
    inbox: screenshots.filter((s) => s.status === 'inbox').length,
    analyzed: screenshots.filter((s) => s.status === 'analyzed').length,
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleUpload = (newScreenshots: Screenshot[]) => {
    setScreenshots((prev) => [...newScreenshots, ...prev])
    setShowUpload(false)
  }

  const handleDeleteFromDetail = (id: string) => {
    setScreenshots((prev) => prev.filter((s) => s.id !== id))
    setSelected((prev) => { const next = new Set(prev); next.delete(id); return next })
  }

  const handleBatchDelete = async () => {
    if (!confirm(`Delete ${selected.size} screenshot${selected.size !== 1 ? 's' : ''}?`)) return
    const ids = Array.from(selected)
    await Promise.all(ids.map((id) => fetch(`/api/screenshots/${id}`, { method: 'DELETE' })))
    setScreenshots((prev) => prev.filter((s) => !ids.includes(s.id)))
    setSelected(new Set())
  }

  const handleBatchAnalyze = async () => {
    const ids = Array.from(selected).filter((id) => {
      const s = screenshots.find((sc) => sc.id === id)
      return s && s.status === 'inbox'
    })
    if (!ids.length) {
      alert('All selected screenshots are already analyzed.')
      return
    }

    setBatchAnalyzing(true)
    setSelected(new Set())

    // Mark all as analyzing immediately
    setScreenshots((prev) =>
      prev.map((s) => ids.includes(s.id) ? { ...s, status: 'analyzing' as const } : s)
    )

    for (const id of ids) {
      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ screenshotId: id }),
        })
        const data = await res.json()
        if (data.screenshot) {
          setScreenshots((prev) =>
            prev.map((s) => s.id === id ? data.screenshot : s)
          )
          // Update detail panel if watching this one
          setActiveDetail((prev) => prev?.id === id ? data.screenshot : prev)
        } else {
          setScreenshots((prev) =>
            prev.map((s) => s.id === id ? { ...s, status: 'inbox' as const } : s)
          )
        }
      } catch {
        setScreenshots((prev) =>
          prev.map((s) => s.id === id ? { ...s, status: 'inbox' as const } : s)
        )
      }
    }

    setBatchAnalyzing(false)
  }

  const openDetail = (screenshot: Screenshot) => {
    // Get fresh version from state
    const fresh = screenshots.find((s) => s.id === screenshot.id) || screenshot
    setActiveDetail(fresh)
  }

  const tabStyle = (tab: FilterTab): React.CSSProperties => ({
    padding: '7px 14px',
    borderRadius: '100px',
    fontSize: '13px',
    fontWeight: filter === tab ? 600 : 500,
    cursor: 'pointer',
    border: 'none',
    backgroundColor: filter === tab ? 'rgba(255,255,255,0.10)' : 'transparent',
    color: filter === tab ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.35)',
    transition: 'all 0.15s ease',
  })

  return (
    <main
      style={{
        minHeight: '100dvh',
        backgroundColor: '#1a1a1a',
        paddingBottom: selected.size > 0
          ? 'calc(env(safe-area-inset-bottom, 0px) + 100px)'
          : 'calc(env(safe-area-inset-bottom, 0px) + 40px)',
        position: 'relative',
      }}
    >
      {/* Ambient orb */}
      <div style={{
        position: 'fixed', top: '10%', left: '50%', transform: 'translateX(-50%)',
        width: '100vw', maxWidth: '600px', height: '400px',
        background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 50%, transparent 75%)',
        pointerEvents: 'none', zIndex: 0, filter: 'blur(40px)',
      }} />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 16px', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 0 0',
          paddingTop: 'max(20px, env(safe-area-inset-top, 20px))',
        }}>
          <div>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.22)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '4px' }}>
              Claude Vision
            </p>
            <h1 style={{ fontSize: '22px', fontWeight: 600, color: 'rgba(255,255,255,0.90)', letterSpacing: '-0.02em' }}>
              Screenshot KB
            </h1>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            style={{
              backgroundColor: '#ffffff', color: '#1a1a1a',
              border: 'none', borderRadius: '100px',
              fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              padding: '10px 20px',
              boxShadow: '0 0 16px rgba(255,255,255,0.08)',
            }}
          >
            Upload
          </button>
        </div>

        {/* Filter tabs */}
        <div style={{
          display: 'flex', gap: '4px', marginTop: '20px', marginBottom: '20px',
          backgroundColor: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '100px', padding: '4px',
          width: 'fit-content',
        }}>
          {(['all', 'inbox', 'analyzed'] as FilterTab[]).map((tab) => (
            <button key={tab} onClick={() => setFilter(tab)} style={tabStyle(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {counts[tab] > 0 && (
                <span style={{
                  marginLeft: '6px', fontSize: '11px',
                  color: filter === tab ? 'rgba(255,255,255,0.50)' : 'rgba(255,255,255,0.20)',
                }}>
                  {counts[tab]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Gallery grid */}
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '14px' }}>Loading...</p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState onUpload={() => setShowUpload(true)} />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
          }}
          className="gallery-grid"
          >
            {filtered.map((screenshot) => (
              <GalleryCard
                key={screenshot.id}
                screenshot={screenshot}
                selected={selected.has(screenshot.id)}
                onToggleSelect={toggleSelect}
                onOpen={openDetail}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating action bar */}
      {selected.size > 0 && (
        <FloatingBar
          count={selected.size}
          analyzing={batchAnalyzing}
          onAnalyze={handleBatchAnalyze}
          onDelete={handleBatchDelete}
          onClear={() => setSelected(new Set())}
        />
      )}

      {/* Detail panel */}
      {activeDetail && (
        <DetailPanel
          screenshot={activeDetail}
          onClose={() => setActiveDetail(null)}
          onDelete={handleDeleteFromDetail}
        />
      )}

      {/* Upload modal */}
      {showUpload && (
        <UploadModal
          onUpload={handleUpload}
          onClose={() => setShowUpload(false)}
        />
      )}

      {/* Responsive grid style */}
      <style>{`
        @media (min-width: 640px) {
          .gallery-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        @media (min-width: 900px) {
          .gallery-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }
      `}</style>
    </main>
  )
}
