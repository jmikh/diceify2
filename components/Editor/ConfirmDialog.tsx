'use client'

import { theme } from '@/lib/theme'
import { X } from 'lucide-react'
import ProgressBar from './ProgressBar'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message?: string
  progress?: number
  confirmText?: string
  confirmButtonColor?: string
  cancelText?: string
  cancelButtonColor?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  progress,
  confirmText = 'Confirm',
  confirmButtonColor = theme.colors.accent.red,
  cancelText = 'Cancel',
  cancelButtonColor = theme.colors.accent.blue,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0"
        style={{ 
          backgroundColor: theme.colors.background.overlay,
          backdropFilter: 'blur(8px)'
        }}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-md rounded-3xl border p-8"
        style={{
          background: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(20px)',
          borderColor: `${theme.colors.accent.purple}33`,
          boxShadow: `0 20px 60px rgba(139, 92, 246, 0.3),
                     0 0 100px rgba(59, 130, 246, 0.1)`
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 rounded-full transition-all hover:bg-white/10"
        >
          <X size={20} className="text-white/60" />
        </button>
        
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            {title}
          </h2>
        </div>
        
        {progress !== undefined && (
          <div className="mb-6">
            <ProgressBar percentage={progress} />
          </div>
        )}
        
        {message && (
          <p className="text-white/60 text-sm text-center mb-8 whitespace-pre-line">
            {message}
          </p>
        )}
        
        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 rounded-xl border transition-all hover:scale-105"
            style={{
              backgroundColor: cancelButtonColor + '20',
              borderColor: cancelButtonColor + '66',
              color: 'white'
            }}
          >
            {cancelText}
          </button>
          
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-3 rounded-xl border transition-all hover:scale-105"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderColor: confirmButtonColor + '66',
              color: confirmButtonColor
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}