'use client'

import { theme } from '@/lib/theme'
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
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onCancel}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 backdrop-blur-sm"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      />
      
      {/* Dialog */}
      <div 
        className="relative backdrop-blur-md border rounded-2xl p-6 max-w-md mx-4"
        style={{ 
          backgroundColor: theme.colors.glass.heavy,
          borderColor: theme.colors.glass.border
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 
          className="text-xl font-bold mb-3"
          style={{ color: theme.colors.text.primary }}
        >
          {title}
        </h2>
        
        {progress !== undefined && (
          <div className="mb-4">
            <ProgressBar percentage={progress} />
          </div>
        )}
        
        {message && (
          <p 
            className="mb-6 text-center whitespace-pre-line"
            style={{ color: theme.colors.text.secondary }}
          >
            {message}
          </p>
        )}
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg transition-all hover:scale-105"
            style={{
              backgroundColor: confirmButtonColor,
              color: 'white'
            }}
          >
            {confirmText}
          </button>
          
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg transition-all hover:scale-105"
            style={{
              backgroundColor: cancelButtonColor,
              color: 'white'
            }}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  )
}