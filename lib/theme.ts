export const theme = {
  colors: {
    // Background colors
    background: {
      primary: '#000000ff', // Main dark purple background
      secondary: '#ffffffff', // Secondary dark purple
      dark: '#000000', // Pure black
      overlay: 'rgba(0, 0, 0, 0.4)', // Dark overlay
    },
    
    // Glass effects
    glass: {
      light: 'rgba(255, 255, 255, 0.05)', // Light glass bg
      medium: 'rgba(255, 255, 255, 0.1)', // Medium glass bg
      heavy: 'rgba(255, 255, 255, 0.2)', // Heavy glass bg
      border: 'rgba(255, 255, 255, 0.1)', // Glass border
      borderHover: 'rgba(255, 255, 255, 0.2)', // Glass border hover
      pink: 'rgba(236, 72, 153, 0.15)', // Pink glass for special controls
      pinkBorder: 'rgba(236, 72, 153, 0.3)', // Pink glass border
    },
    
    // Text colors
    text: {
      primary: 'rgba(255, 255, 255, 0.9)', // Primary white text
      secondary: 'rgba(255, 255, 255, 0.7)', // Secondary white text
      muted: 'rgba(255, 255, 255, 0.5)', // Muted white text
      dim: 'rgba(255, 255, 255, 0.3)', // Dim white text
    },
    
    // Accent colors
    accent: {
      blue: '#6495ff', // Primary blue
      purple: '#9333ea', // Primary purple
      pink: '#ec4899', // Primary pink
      green: '#22c55e', // Success green
      red: '#ef4444', // Error red
    },
    
    // Glow colors (for shadows and effects)
    glow: {
      blue: 'rgba(100, 149, 255, 0.2)',
      purple: 'rgba(147, 51, 234, 0.2)',
      pink: 'rgba(236, 72, 153, 0.2)',
      green: 'rgba(34, 197, 94, 0.2)',
    },
    
    // Dice stepper specific
    dice: {
      inactive: 'rgba(20, 20, 35, 0.8)',
      active: 'rgba(30, 30, 50, 0.9)',
      activeGlow: 'rgba(100, 150, 255, 0.5)',
      previous: 'rgba(40, 50, 80, 0.6)',
      previousBorder: 'rgba(100, 150, 255, 0.5)',
      previousGlow: 'rgba(100, 150, 255, 0.2)',
      highlightColor: '#6495ff', // Primary blue for selected dice highlight in build viewer
    }
  },
  
  // Border radius values
  radius: {
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    '2xl': '2rem',
    full: '9999px',
  },
  
  // Blur values
  blur: {
    sm: '8px',
    md: '12px',
    lg: '24px',
    xl: '40px',
  },
} as const

export type Theme = typeof theme