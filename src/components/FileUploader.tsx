import { useState, useRef, type DragEvent } from 'react'

interface FileUploaderProps {
  onFileSelected: (file: File) => void
  isUploading: boolean
  disabled?: boolean
}

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

export default function FileUploader({ onFileSelected, isUploading, disabled = false }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return `"${file.name}" is not a PDF. Only .pdf files are supported.`
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File is too large (${formatSize(file.size)}). Maximum size is 100MB.`
    }
    if (file.size === 0) {
      return 'This file appears to be empty. Please select a valid PDF.'
    }
    return null
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    if (disabled) return
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    if (disabled) return
    setIsDragging(false)
    setFileError(null)

    const file = e.dataTransfer.files[0]
    if (!file) return

    const error = validateFile(file)
    if (error) {
      setFileError(error)
      // Auto-dismiss after 5 seconds
      setTimeout(() => setFileError(null), 5000)
      return
    }

    setSelectedFile(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null)
    const file = e.target.files?.[0]
    if (!file) return

    const error = validateFile(file)
    if (error) {
      setFileError(error)
      setTimeout(() => setFileError(null), 5000)
      // Reset input so user can re-select
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    setSelectedFile(file)
  }

  const handleAnalyze = () => {
    if (selectedFile) {
      onFileSelected(selectedFile)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="w-full">
      {/* File Error Toast */}
      {fileError && (
        <div
          className="rounded-xl px-4 py-3 text-center animate-fade-rise"
          style={{
            marginBottom: '1rem',
            backgroundColor: 'rgba(220, 38, 38, 0.04)',
            border: '1px solid rgba(220, 38, 38, 0.12)',
          }}
        >
          <div className="flex items-center justify-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <p className="text-sm" style={{ color: '#DC2626', margin: 0 }}>{fileError}</p>
          </div>
        </div>
      )}

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => { if (!disabled) inputRef.current?.click() }}
        className={`relative rounded-2xl transition-all duration-300 ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
        style={{
          border: `2px dashed ${isDragging ? '#000000' : fileError ? 'rgba(220, 38, 38, 0.3)' : 'rgba(0,0,0,0.15)'}`,
          backgroundColor: isDragging ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.6)',
          backdropFilter: 'blur(12px)',
          padding: selectedFile ? 'clamp(1.25rem, 3vw, 2rem)' : 'clamp(2rem, 5vw, 3.5rem) clamp(1rem, 3vw, 2rem)',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          className="hidden"
          id="pdf-upload-input"
        />

        {!selectedFile ? (
          <div className="flex flex-col items-center justify-center text-center gap-4">
            {/* Upload Icon */}
            <div
              className="flex items-center justify-center rounded-2xl"
              style={{
                width: '64px',
                height: '64px',
                backgroundColor: 'rgba(0,0,0,0.04)',
              }}
            >
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#000000"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>

            <div>
              <p className="font-display text-xl text-black mb-1">
                Drop your PYQ PDF here
              </p>
              <p className="text-sm" style={{ color: '#6F6F6F' }}>
                or click to browse • Single combined PDF of all years
              </p>
              <p className="text-xs" style={{ color: '#AAAAAA', marginTop: '0.5rem' }}>
                PDF only • Max 100MB
              </p>
            </div>
          </div>
        ) : (
          /* Selected File Display */
          <div className="flex items-center justify-between" style={{ gap: '0.75rem' }}>
            <div className="flex items-center gap-4">
              <div
                className="flex items-center justify-center rounded-xl"
                style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: 'rgba(0,0,0,0.05)',
                  flexShrink: 0,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div className="text-left" style={{ minWidth: 0, overflow: 'hidden' }}>
                <p className="text-sm font-medium text-black" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFile.name}</p>
                <p className="text-xs" style={{ color: '#6F6F6F' }}>{formatSize(selectedFile.size)}</p>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelectedFile(null)
                setFileError(null)
                if (inputRef.current) inputRef.current.value = ''
              }}
              className="text-xs rounded-full transition-colors cursor-pointer bg-transparent"
              style={{
                color: '#6F6F6F',
                border: '1px solid rgba(0,0,0,0.12)',
                padding: '0.375rem 1rem',
              }}
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {/* Analyze Button */}
      {selectedFile && (
        <div className="flex justify-center animate-fade-rise" style={{ marginTop: 'clamp(2rem, 5vw, 4rem)', marginBottom: 'clamp(1.5rem, 4vw, 3rem)' }}>
          <button
            onClick={handleAnalyze}
            disabled={isUploading}
            className="transition-all duration-200 hover:scale-[1.03] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-none"
            style={{
              backgroundColor: '#000000',
              color: '#FFFFFF',
              fontFamily: "'Inter', sans-serif",
              fontSize: '1rem',
              padding: '1rem 3rem',
              borderRadius: '9999px',
            }}
            id="analyze-button"
          >
            {isUploading ? (
              <span className="flex items-center gap-3">
                <svg className="animate-spin-slow" style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" strokeDasharray="31.4 31.4" />
                </svg>
                Analyzing...
              </span>
            ) : (
              'Analyze Questions'
            )}
          </button>
        </div>
      )}
    </div>
  )
}
