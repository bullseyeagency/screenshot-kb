'use client'

import { useRef, useState, DragEvent, ChangeEvent } from 'react'

interface DropZoneProps {
  onAnalyze: (files: File[]) => void
  disabled?: boolean
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Multi-image drag-and-drop / tap-to-upload zone.
 * Mobile: triggers native photo library + camera picker (multiple select).
 */
export default function DropZone({ onAnalyze, disabled }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = (incoming: FileList | File[]) => {
    const arr = Array.from(incoming).filter((f) => f.type.startsWith('image/'))
    if (!arr.length) return

    const newFiles = [...files, ...arr].slice(0, 20) // cap at 20
    setFiles(newFiles)

    // generate previews for new files only
    arr.forEach((file, i) => {
      if (files.length + i >= 20) return
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviews((prev) => {
          const next = [...prev]
          next[files.length + i] = e.target?.result as string
          return next
        })
      }
      reader.readAsDataURL(file)
    })
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
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
    addFiles(e.dataTransfer.files)
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleReset = () => {
    setFiles([])
    setPreviews([])
  }

  const orbGlow = isDragging
    ? '0 0 80px 30px rgba(255,255,255,0.10), 0 0 160px 80px rgba(220,230,255,0.06), inset 0 0 80px 30px rgba(255,255,255,0.05)'
    : '0 0 60px 24px rgba(255,255,255,0.06), 0 0 120px 60px rgba(220,230,255,0.03), inset 0 0 60px 24px rgba(255,255,255,0.03)'

  const orbBg = isDragging
    ? 'radial-gradient(ellipse at center, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 50%, transparent 75%)'
    : 'radial-gradient(ellipse at center, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 45%, transparent 72%)'

  return (
    <div style={{ width: '100%', position: 'relative', zIndex: 1 }}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleInputChange}
        style={{ display: 'none' }}
      />

      {/* Drop / tap zone */}
      {files.length === 0 ? (
        <div
          onClick={() => !disabled && inputRef.current?.click()}
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
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: disabled ? 'default' : 'pointer',
            transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
            padding: '32px 24px',
            WebkitUserSelect: 'none',
            userSelect: 'none',
          }}
        >
          {/* Orb icon */}
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
          <p style={{ color: 'rgba(255,255,255,0.80)', fontSize: '17px', fontWeight: 500, marginBottom: '6px' }}>
            {isDragging ? 'Release to drop' : 'Tap to add photos'}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '14px' }}>
            Camera, photo library, or drag &amp; drop
          </p>
        </div>
      ) : (
        /* Thumbnail grid */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            borderRadius: '24px',
            border: `1px solid ${isDragging ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.08)'}`,
            background: 'rgba(255,255,255,0.02)',
            padding: '16px',
            transition: 'border-color 0.2s',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
            }}
          >
            {files.map((file, i) => (
              <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: '12px', overflow: 'hidden' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {previews[i] && (
                  <img
                    src={previews[i]}
                    alt={file.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
                {/* Remove button */}
                <button
                  onClick={() => removeFile(i)}
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: '14px',
                    lineHeight: 1,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                  }}
                >
                  ×
                </button>
              </div>
            ))}

            {/* Add more tile */}
            {files.length < 20 && (
              <button
                onClick={() => inputRef.current?.click()}
                style={{
                  aspectRatio: '1',
                  borderRadius: '12px',
                  border: '1px dashed rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.02)',
                  color: 'rgba(255,255,255,0.3)',
                  fontSize: '28px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                +
              </button>
            )}
          </div>

          {/* File count + clear */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', padding: '0 4px' }}>
            <span style={{ color: 'rgba(255,255,255,0.30)', fontSize: '13px' }}>
              {files.length} photo{files.length !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={handleReset}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.22)',
                fontSize: '13px',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: '8px 0',
                minHeight: '44px',
              }}
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* Analyze button */}
      {files.length > 0 && !disabled && (
        <div style={{ marginTop: '16px' }}>
          <button
            onClick={() => onAnalyze(files)}
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
              boxShadow: '0 0 24px 4px rgba(255,255,255,0.08)',
              minHeight: '56px',
            }}
          >
            Analyze {files.length} Image{files.length !== 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  )
}
