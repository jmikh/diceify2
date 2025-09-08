/**
 * ThemeSwitcher Component
 * 
 * Dropdown component for switching between different themes.
 * Persists selection to localStorage and applies theme immediately.
 */

'use client'

import { useState, useEffect } from 'react'
import { themes, ThemeName, applyTheme, getCurrentTheme } from '@/lib/themes'

export default function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('glassmorphism')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Initialize theme on mount
    const theme = getCurrentTheme()
    setCurrentTheme(theme)
    applyTheme(theme)
  }, [])

  const handleThemeChange = (themeName: ThemeName) => {
    setCurrentTheme(themeName)
    applyTheme(themeName)
    setIsOpen(false)
  }

  const themeOptions = [
    { value: 'glassmorphism', label: '🌌 Glassmorphism', description: 'Transparent layers' },
    { value: 'cyberpunk', label: '🤖 Cyberpunk', description: 'Neon glow' },
    { value: 'minimal', label: '☁️ Minimal', description: 'Clean & light' },
    { value: 'dark', label: '🌙 Dark', description: 'Pure dark mode' },
  ] as const

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 rounded-lg backdrop-blur-md border transition-all flex items-center gap-2 text-sm"
        style={{
          backgroundColor: 'var(--glass-medium)',
          borderColor: 'var(--glass-border)',
          color: 'var(--text-secondary)'
        }}
      >
        <span className="text-xs">🎨</span>
        <span>{themes[currentTheme].name}</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div 
            className="absolute right-0 mt-2 w-64 rounded-xl backdrop-blur-xl border shadow-2xl z-50 overflow-hidden"
            style={{
              backgroundColor: 'var(--glass-heavy)',
              borderColor: 'var(--glass-border)'
            }}
          >
            {themeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleThemeChange(option.value)}
                className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-start gap-3"
                style={{
                  backgroundColor: currentTheme === option.value ? 'var(--glass-medium)' : 'transparent'
                }}
              >
                <span className="text-lg mt-0.5">{option.label.split(' ')[0]}</span>
                <div>
                  <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {option.label.split(' ')[1]}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {option.description}
                  </div>
                </div>
                {currentTheme === option.value && (
                  <svg className="w-5 h-5 ml-auto mt-1" style={{ color: 'var(--accent-green)' }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}