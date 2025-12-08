export const theme = {
  colors: {
    // Primary color system - easily change the entire theme
    primary: '#9333ea', // Purple
    primaryRgb: '147, 51, 234',
    secondary: '#6495ff', // Blue
    secondaryRgb: '100, 149, 255',
    tertiary: '#ec4899', // Pink
    tertiaryRgb: '236, 72, 153',

    // Status colors
    success: '#22c55e',
    error: '#ef4444',
    warning: '#f59e0b',

    // Amazon brand color (for affiliate button)
    amazon: '#FF9900',

    // Background colors
    background: {
      primary: '#000000ff', // Main black background
      secondary: '#ffffffff', // White background
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
    },

    // Text colors
    text: {
      primary: 'rgba(255, 255, 255, 0.9)', // Primary white text
      secondary: 'rgba(255, 255, 255, 0.7)', // Secondary white text
      muted: 'rgba(255, 255, 255, 0.5)', // Muted white text
      dim: 'rgba(255, 255, 255, 0.3)', // Dim white text
    },

    // Legacy accent colors (for backward compatibility - will be removed)
    accent: {
      blue: '#6495ff', // Use theme.colors.secondary instead
      purple: '#9333ea', // Use theme.colors.primary instead
      pink: '#ec4899', // Use theme.colors.tertiary instead
      green: '#22c55e', // Use theme.colors.success instead
      red: '#ef4444', // Use theme.colors.error instead
    },

    // Glow colors (for shadows and effects)
    glow: {
      blue: 'rgba(100, 149, 255, 0.2)', // Use with theme.colors.secondary
      purple: 'rgba(147, 51, 234, 0.2)', // Use with theme.colors.primary
      pink: 'rgba(236, 72, 153, 0.2)', // Use with theme.colors.tertiary
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
      highlightColor: '#ec4899', // Primary pink for selected dice highlight in build viewer
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