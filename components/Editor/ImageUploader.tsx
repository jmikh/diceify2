'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { theme } from '@/lib/theme'

interface ImageUploaderProps {
  onImageUpload: (imageUrl: string) => void
  currentImage?: string | null
}

export default function ImageUploader({
  onImageUpload,
  currentImage
}: ImageUploaderProps) {
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
          relative rounded-2xl text-center cursor-pointer transition-all
          backdrop-blur-md border overflow-hidden
        `}
        style={{
          background: currentImage ? 'transparent' : 'rgba(255, 255, 255, 0.05)',
          backdropFilter: currentImage ? 'none' : 'blur(10px)',
          borderColor: isDragging ? `${theme.colors.accent.blue}33` : `${theme.colors.accent.purple}33`,
          boxShadow: isDragging
            ? `0 20px 60px rgba(59, 130, 246, 0.4),
               0 0 100px rgba(59, 130, 246, 0.2),
               0 10px 30px rgba(0, 0, 0, 0.3)`
            : `0 20px 60px rgba(139, 92, 246, 0.3),
               0 0 100px rgba(59, 130, 246, 0.1),
               0 10px 30px rgba(0, 0, 0, 0.3)`,
          height: '400px'
        }}
      >
        <input {...getInputProps()} />

        <div className="relative w-full h-full">
          {/* Background image if uploaded */}
          {currentImage && (
            <img
              src={currentImage}
              alt="Uploaded"
              className="absolute inset-0 w-full h-full object-cover opacity-30"
            />
          )}

          {/* Dashed border rectangle */}
          <div
            className="absolute inset-4 border-2 border-dashed border-gray-400/30 rounded-xl pointer-events-none"
          />

          {/* Content overlay - same for both states */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-medium mb-3" style={{ color: theme.colors.accent.blue }}>
              {isDragging ? '🎲 Drop to roll the dice!' : 'Drop your image here'}
            </p>
            <p className="text-sm text-white/50 mb-6">
              or click to browse your files
            </p>
            <span className="px-5 py-2.5 rounded-lg text-white font-medium text-base cursor-pointer transition-all hover:scale-105 hover:shadow-lg"
                  style={{
                    backgroundColor: theme.colors.accent.blue,
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
                  }}>
              {currentImage ? 'Change Image' : 'Upload Image'}
            </span>
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