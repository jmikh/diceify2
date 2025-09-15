/**
 * Reusable visual effects for consistent styling across the application
 * All effects use theme colors and can be easily customized
 */

import { theme } from '@/lib/theme'

/**
 * Glass morphism effects with backdrop blur and subtle backgrounds
 */
export const glassEffect = {
  light: {
    background: theme.colors.glass.light,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  },
  medium: {
    background: theme.colors.glass.medium,
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  },
  heavy: {
    background: theme.colors.glass.heavy,
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
  },
}

/**
 * Floating card shadow effects
 * Creates the illusion of elevation with layered shadows
 */
export const floatingCardShadow = {
  primary: `0 10px 40px rgba(${theme.colors.primaryRgb}, 0.25),
            0 0 60px rgba(${theme.colors.secondaryRgb}, 0.08),
            0 5px 20px rgba(0, 0, 0, 0.3)`,

  secondary: `0 20px 60px rgba(${theme.colors.secondaryRgb}, 0.3),
              0 0 100px rgba(${theme.colors.secondaryRgb}, 0.1),
              0 10px 30px rgba(0, 0, 0, 0.3)`,

  tertiary: `0 10px 40px rgba(${theme.colors.tertiaryRgb}, 0.25),
             0 0 60px rgba(${theme.colors.secondaryRgb}, 0.08),
             0 5px 20px rgba(0, 0, 0, 0.3)`,

  hover: `0 20px 60px rgba(${theme.colors.secondaryRgb}, 0.4),
          0 0 100px rgba(${theme.colors.secondaryRgb}, 0.2),
          0 10px 30px rgba(0, 0, 0, 0.3)`,

  subtle: `0 4px 20px rgba(0, 0, 0, 0.1),
           0 0 40px rgba(${theme.colors.primaryRgb}, 0.05)`,

  // Dragging state for drag and drop
  dragging: `0 20px 60px rgba(${theme.colors.secondaryRgb}, 0.4),
             0 0 100px rgba(${theme.colors.secondaryRgb}, 0.2),
             0 10px 30px rgba(0, 0, 0, 0.3)`,
}

/**
 * Button shadow effects for different states
 */
export const buttonShadow = {
  default: `0 2px 8px rgba(0, 0, 0, 0.2)`,
  hover: `0 4px 12px rgba(${theme.colors.secondaryRgb}, 0.4)`,
  active: `0 1px 4px rgba(0, 0, 0, 0.2)`,
  primary: `0 4px 12px rgba(${theme.colors.primaryRgb}, 0.4)`,
  secondary: `0 4px 12px rgba(${theme.colors.secondaryRgb}, 0.4)`,
  tertiary: `0 4px 12px rgba(${theme.colors.tertiaryRgb}, 0.4)`,
}

/**
 * Glow effects for interactive elements
 */
export const glowEffect = {
  primary: {
    boxShadow: `0 0 20px rgba(${theme.colors.primaryRgb}, 0.4)`,
  },
  secondary: {
    boxShadow: `0 0 20px rgba(${theme.colors.secondaryRgb}, 0.4)`,
  },
  tertiary: {
    boxShadow: `0 0 20px rgba(${theme.colors.tertiaryRgb}, 0.4)`,
  },
  success: {
    boxShadow: `0 0 20px rgba(34, 197, 94, 0.4)`,
  },
  subtle: {
    boxShadow: `0 0 10px rgba(${theme.colors.primaryRgb}, 0.2)`,
  },
  intense: {
    boxShadow: `0 0 30px rgba(${theme.colors.primaryRgb}, 0.6), 0 0 60px rgba(${theme.colors.primaryRgb}, 0.3)`,
  },
}

/**
 * Border styles with consistent theming
 */
export const borderStyles = {
  default: {
    border: `1px solid ${theme.colors.glass.border}`,
  },
  hover: {
    border: `1px solid ${theme.colors.glass.borderHover}`,
  },
  primary: {
    border: `1px solid rgba(${theme.colors.primaryRgb}, 0.2)`,
  },
  secondary: {
    border: `1px solid rgba(${theme.colors.secondaryRgb}, 0.2)`,
  },
  tertiary: {
    border: `1px solid rgba(${theme.colors.tertiaryRgb}, 0.2)`,
  },
  dashed: {
    border: `2px dashed ${theme.colors.glass.border}`,
  },
}

/**
 * Composite styles for common component patterns
 */
export const cardStyles = {
  floating: {
    ...glassEffect.light,
    borderColor: `rgba(${theme.colors.primaryRgb}, 0.2)`,
    boxShadow: floatingCardShadow.primary,
    borderRadius: theme.radius['2xl'],
  },
  floatingHover: {
    ...glassEffect.medium,
    borderColor: `rgba(${theme.colors.primaryRgb}, 0.3)`,
    boxShadow: floatingCardShadow.hover,
    borderRadius: theme.radius['2xl'],
    transform: 'translateY(-2px)',
    transition: 'all 0.3s ease',
  },
  panel: {
    ...glassEffect.light,
    border: `1px solid ${theme.colors.glass.border}`,
    borderRadius: theme.radius.lg,
  },
}

/**
 * Transition presets for smooth animations
 */
export const transitions = {
  default: 'all 0.2s ease',
  slow: 'all 0.3s ease',
  smooth: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
}