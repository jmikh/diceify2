'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { theme } from '@/lib/theme'
import { X } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  onClose?: () => void
  onSuccess?: () => void
  message?: string
  editorState?: {
    originalImage?: string | null
    croppedImage?: string | null
    processedImageUrl?: string | null
    cropParams?: any
    diceParams?: any
    step?: string
    lastReachedStep?: string
  }
}

export default function AuthModal({
  isOpen, onClose, onSuccess, message, editorState }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleProviderSignIn = async (provider: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      // OAuth providers require redirect, so save state to sessionStorage first
      // The editor will restore this state after redirect
      if (editorState) {
        console.log('[DEBUG] Saving editor state before OAuth redirect')
        sessionStorage.setItem('editorStateBeforeAuth', JSON.stringify(editorState))
      }
      
      // For OAuth providers, we must redirect to the provider's auth page
      await signIn(provider, {
        callbackUrl: '/editor?restored=true'  // Add flag to indicate state should be restored
      })
      // The page will redirect, so this code won't execute
    } catch (err) {
      setError('An unexpected error occurred.')
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
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
      >
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full transition-all hover:bg-white/10"
            disabled={isLoading}
          >
            <X size={20} className="text-white/60" />
          </button>
        )}
        
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Continue Your Art
          </h2>
          <p className="text-white/60 text-sm">
            {message || 'Sign in to save your progress and continue building'}
          </p>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}
        
        {/* Sign in buttons */}
        <div className="space-y-3">
          <button
            onClick={() => handleProviderSignIn('google')}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl border transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-white/80">Continue with Google</span>
          </button>
        </div>
        
        {/* Terms */}
        <p className="text-center text-xs text-white/40 mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}