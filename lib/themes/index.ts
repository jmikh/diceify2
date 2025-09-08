/**
 * Theme System
 * 
 * Centralized theme management with multiple theme presets.
 * Uses CSS variables that can be easily swapped at runtime.
 * Integrates with Tailwind for consistent styling.
 */

export interface ThemeColors {
  // Background colors
  bgPrimary: string
  bgSecondary: string
  bgDark: string
  
  // Glass effects
  glassLight: string
  glassMedium: string
  glassHeavy: string
  glassBorder: string
  
  // Text colors
  textPrimary: string
  textSecondary: string
  textMuted: string
  
  // Accent colors
  accentBlue: string
  accentPurple: string
  accentPink: string
  accentGreen: string
  accentRed: string
  
  // Glow colors (for shadows and effects)
  glowBlue: string
  glowPurple: string
  glowPink: string
  glowGreen: string
}

export interface Theme {
  name: string
  colors: ThemeColors
}

// Glassmorphism Theme (Current)
export const glassmorphismTheme: Theme = {
  name: 'glassmorphism',
  colors: {
    bgPrimary: '#0a0014',
    bgSecondary: '#1a0826',
    bgDark: '#000000',
    
    glassLight: 'rgba(255, 255, 255, 0.05)',
    glassMedium: 'rgba(255, 255, 255, 0.1)',
    glassHeavy: 'rgba(255, 255, 255, 0.2)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    
    textPrimary: 'rgba(255, 255, 255, 0.9)',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    textMuted: 'rgba(255, 255, 255, 0.5)',
    
    accentBlue: '#6495ff',
    accentPurple: '#9333ea',
    accentPink: '#ec4899',
    accentGreen: '#22c55e',
    accentRed: '#ef4444',
    
    glowBlue: 'rgba(100, 149, 255, 0.2)',
    glowPurple: 'rgba(147, 51, 234, 0.2)',
    glowPink: 'rgba(236, 72, 153, 0.2)',
    glowGreen: 'rgba(34, 197, 94, 0.2)',
  }
}

// Cyberpunk Theme
export const cyberpunkTheme: Theme = {
  name: 'cyberpunk',
  colors: {
    bgPrimary: '#0a0a0a',
    bgSecondary: '#1a1a1a',
    bgDark: '#000000',
    
    glassLight: 'rgba(0, 255, 255, 0.05)',
    glassMedium: 'rgba(0, 255, 255, 0.1)',
    glassHeavy: 'rgba(0, 255, 255, 0.2)',
    glassBorder: 'rgba(0, 255, 255, 0.3)',
    
    textPrimary: '#00ffff',
    textSecondary: '#00cccc',
    textMuted: '#008888',
    
    accentBlue: '#00ffff',
    accentPurple: '#ff00ff',
    accentPink: '#ff0080',
    accentGreen: '#00ff00',
    accentRed: '#ff0040',
    
    glowBlue: 'rgba(0, 255, 255, 0.4)',
    glowPurple: 'rgba(255, 0, 255, 0.4)',
    glowPink: 'rgba(255, 0, 128, 0.4)',
    glowGreen: 'rgba(0, 255, 0, 0.4)',
  }
}

// Minimal Light Theme
export const minimalTheme: Theme = {
  name: 'minimal',
  colors: {
    bgPrimary: '#ffffff',
    bgSecondary: '#f9fafb',
    bgDark: '#f3f4f6',
    
    glassLight: 'rgba(0, 0, 0, 0.02)',
    glassMedium: 'rgba(0, 0, 0, 0.05)',
    glassHeavy: 'rgba(0, 0, 0, 0.1)',
    glassBorder: 'rgba(0, 0, 0, 0.1)',
    
    textPrimary: '#111827',
    textSecondary: '#4b5563',
    textMuted: '#9ca3af',
    
    accentBlue: '#3b82f6',
    accentPurple: '#8b5cf6',
    accentPink: '#ec4899',
    accentGreen: '#10b981',
    accentRed: '#ef4444',
    
    glowBlue: 'rgba(59, 130, 246, 0.1)',
    glowPurple: 'rgba(139, 92, 246, 0.1)',
    glowPink: 'rgba(236, 72, 153, 0.1)',
    glowGreen: 'rgba(16, 185, 129, 0.1)',
  }
}

// Dark Mode Theme
export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    bgPrimary: '#0f0f0f',
    bgSecondary: '#1a1a1a',
    bgDark: '#000000',
    
    glassLight: 'rgba(255, 255, 255, 0.03)',
    glassMedium: 'rgba(255, 255, 255, 0.06)',
    glassHeavy: 'rgba(255, 255, 255, 0.12)',
    glassBorder: 'rgba(255, 255, 255, 0.08)',
    
    textPrimary: '#ffffff',
    textSecondary: '#a0a0a0',
    textMuted: '#606060',
    
    accentBlue: '#4a9eff',
    accentPurple: '#a855f7',
    accentPink: '#f472b6',
    accentGreen: '#34d399',
    accentRed: '#f87171',
    
    glowBlue: 'rgba(74, 158, 255, 0.15)',
    glowPurple: 'rgba(168, 85, 247, 0.15)',
    glowPink: 'rgba(244, 114, 182, 0.15)',
    glowGreen: 'rgba(52, 211, 153, 0.15)',
  }
}

// Available themes
export const themes = {
  glassmorphism: glassmorphismTheme,
  cyberpunk: cyberpunkTheme,
  minimal: minimalTheme,
  dark: darkTheme,
}

export type ThemeName = keyof typeof themes

// Function to apply theme to document
export function applyTheme(themeName: ThemeName) {
  const theme = themes[themeName]
  const root = document.documentElement
  
  // Set CSS variables
  Object.entries(theme.colors).forEach(([key, value]) => {
    // Convert camelCase to kebab-case
    const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`
    root.style.setProperty(cssVar, value)
  })
  
  // Store theme preference
  localStorage.setItem('diceify-theme', themeName)
  
  // Add theme class to body for Tailwind
  document.body.className = `theme-${themeName}`
}

// Get current theme from localStorage
export function getCurrentTheme(): ThemeName {
  const stored = localStorage.getItem('diceify-theme') as ThemeName
  return stored && stored in themes ? stored : 'glassmorphism'
}

// Initialize theme on load
export function initializeTheme() {
  if (typeof window !== 'undefined') {
    applyTheme(getCurrentTheme())
  }
}