'use client'

import { useRef, useState, DragEvent, ChangeEvent } from 'react'

interface DropZoneProps {
  onAnalyze: (file: File) => void
  disabled?: boolean
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Drag-and-drop / tap-to-upload image zone.
 * Mobile: triggers native photo library + camera picker.
 * Desktop: drag-and-drop or click-to-browse.
 */
export default function DropZone({ onAnalyze, disabled }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const acceptFile = (file: File) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif']
    if (!allowed.includes(file.type) && !file.type.startsWith('image/')) return
    setSelectedFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) acceptFile(file)
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) acceptFile(file)
  }

  const handleReset = () => {
    setSelectedFile(null)
    setPreview(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const orbGlow = isDragging
    ? '0 0 80px 30px rgba(255,255,255,0.10), 0 0 160px 80px rgba(220,230,255,0.06), inset 0 0 80px 30px rgba(255,255,255,0.05)'
    : selectedFile
    ? '0 0 40px 16px rgba(255,255,255,0.05), inset 0 0 40px 16px rgba(255,255,255,0.02)'
    : '0 0 60px 24px rgba(255,255,255,0.06), 0 0 120px 60px rgba(220,230,255,0.03), inset 0 0 60px 24px rgba(255,255,255,0.03)'

  const orbBg = isDragging
    ? 'radial-gradient(ellipse at center, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 50%, transparent 75%)'
    : 'radial-gradient(ellipse at center, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 45%, transparent 72%)'

  return (
    <div style={{ width: '100%', position: 'relative', zIndex: 1 }}>
      {/* Hidden file input — image/* opens camera + photo library on mobile */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        style={{ display: 'none' }}
      />

      <div
        onClick={!selectedFile && !disabled ? () => inputRef.current?.click() : undefined}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          borderRadius: '24px',
          border: `1px solid ${isDragging ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.08)'}`,
          background: orbBg,
          boxShadow: orbGlow,
          minHeight: '56vw',
          maxHeight: '360px',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: selectedFile || disabled ? 'default' : 'pointer',
          transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
          padding: '32px 24px',
          position: 'relative',
          overflow: 'hidden',
          WebkitUserSelect: 'none',
          userSelect: 'none',
        }}
      >
        {preview && selectedFile ? (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Preview"
              style={{
                maxHeight: '200px',
                maxWidth: '100%',
                objectFit: 'contain',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 4px 32px rgba(0,0,0,0.4)',
              }}
            />
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', fontWeight: 500 }}>
                {selectedFile.name}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginTop: '3px' }}>
                {formatBytes(selectedFile.size)}
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleReset() }}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.25)',
                fontSize: '13px',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: '8px 0',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              Remove and choose another
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', userSelect: 'none' }}>
            {/* Orb icon — soft glow sphere */}
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                margin: '0 auto 24px',
                background: isDragging
                  ? 'radial-gradient(circle at 38% 36%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.18) 45%, transparent 70%)'
                  : 'radial-gradient(circle at 38% 36%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.10) 45%, transparent 70%)',
                boxShadow: isDragging
                  ? '0 0 32px 12px rgba(255,255,255,0.18), inset 0 0 16px 4px rgba(255,255,255,0.12)'
                  : '0 0 24px 8px rgba(255,255,255,0.08), inset 0 0 12px 3px rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                transition: 'all 0.3s ease',
              }}
            />
            <p style={{
              color: 'rgba(255,255,255,0.80)',
              fontSize: '17px',
              fontWeight: 500,
              marginBottom: '6px',
            }}>
              Tap to add a photo
            </p>
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '14px' }}>
              Camera or photo library
            </p>
          </div>
        )}
      </div>

      {/* Analyze button — large for mobile thumb reach */}
      {selectedFile && !disabled && (
        <div style={{ marginTop: '16px' }}>
          <button
            onClick={() => onAnalyze(selectedFile)}
            style={{
              width: '100%',
              padding: '18px',
              backgroundColor: '#ffffff',
              color: '#1a1a1a',
              border: 'none',
              borderRadius: '16px',
              fontSize: '17px',
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: '0.01em',
              boxShadow: '0 0 24px 4px rgba(255,255,255,0.08)',
              minHeight: '56px',
            }}
          >
            Analyze Image
          </button>
        </div>
      )}
    </div>
  )
}
