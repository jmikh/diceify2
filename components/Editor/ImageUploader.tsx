'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { theme } from '@/lib/theme'

interface ImageUploaderProps {
  onImageUpload: (imageUrl: string) => void
}

export default function ImageUploader({ onImageUpload }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null)
    
    if (acceptedFiles.length === 0) {
      setError('Please upload a valid image file')
      return
    }

    const file = acceptedFiles[0]
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB')
      return
    }

    // Read the file
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result
      if (typeof result === 'string') {
        // Create an image to check dimensions
        const img = new Image()
        img.onload = () => {
          // Resize if too large
          if (img.width > 4096 || img.height > 4096) {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            if (!ctx) return

            const maxSize = 4096
            const scale = Math.min(maxSize / img.width, maxSize / img.height)
            canvas.width = img.width * scale
            canvas.height = img.height * scale

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
            onImageUpload(canvas.toDataURL('image/jpeg', 0.9))
          } else {
            onImageUpload(result)
          }
        }
        img.src = result
      }
    }
    reader.readAsDataURL(file)
  }, [onImageUpload])

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 1,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    onDropAccepted: () => setIsDragging(false),
    onDropRejected: () => {
      setIsDragging(false)
      setError('Invalid file type. Please upload an image.')
    }
  })

  return (
    <div className="max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
          backdrop-blur-xl
          ${isDragging 
            ? 'border-blue-400 shadow-2xl' 
            : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10 hover:shadow-xl'
          }
        `}
        style={{
          backgroundColor: isDragging ? theme.colors.glass.heavy : theme.colors.glass.light,
          boxShadow: isDragging ? `0 0 40px ${theme.colors.glow.blue}` : undefined
        }}
      >
        <input {...getInputProps()} />
        
        <div className="relative">
          {/* Animated dice icon */}
          <div className="mx-auto w-20 h-20 mb-6 relative">
            <div className="absolute inset-0 flex items-center justify-center text-5xl animate-pulse">
              ⚅
            </div>
            <div className="absolute inset-0 flex items-center justify-center text-5xl animate-pulse delay-75 opacity-50">
              ⚄
            </div>
            <div className="absolute inset-0 flex items-center justify-center text-5xl animate-pulse delay-150 opacity-30">
              ⚃
            </div>
          </div>
          
          <p className="text-xl font-medium mb-2" style={{ color: theme.colors.accent.blue }}>
            {isDragging ? '🎲 Drop to roll the dice!' : 'Drop your image here'}
          </p>
          <p className="text-sm text-white/50 mb-4">
            or click to browse your files
          </p>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20" style={{ backgroundColor: theme.colors.glass.medium }}>
            <svg
              className="w-5 h-5 text-white/70"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <span className="text-white/70 text-sm">PNG, JPG, GIF, WebP up to 10MB</span>
          </div>
        </div>
        
        {error && (
          <div className="absolute bottom-4 left-4 right-4 p-3 backdrop-blur-md bg-red-500/20 border border-red-500/40 text-red-400 rounded-lg">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}