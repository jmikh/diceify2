import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Map CSS variables to Tailwind colors
        theme: {
          bg: {
            primary: 'var(--bg-primary)',
            secondary: 'var(--bg-secondary)',
            dark: 'var(--bg-dark)',
            deep: 'var(--bg-deep)',
            glass: {
              DEFAULT: 'var(--bg-glass)',
              hover: 'var(--bg-glass-hover)',
            }
          },
          glass: {
            light: 'var(--glass-light)',
            medium: 'var(--glass-medium)',
            heavy: 'var(--glass-heavy)',
            border: 'var(--glass-border)',
            DEFAULT: 'var(--bg-glass)',
            hover: 'var(--bg-glass-hover)',
          },
          text: {
            primary: 'var(--text-primary)',
            secondary: 'var(--text-secondary)',
            muted: 'var(--text-muted)',
            dim: 'var(--text-dim)',
          },
          accent: {
            blue: 'var(--accent-blue)',
            purple: 'var(--accent-purple)',
            pink: 'var(--accent-pink)',
            green: 'var(--accent-green)',
            red: 'var(--accent-red)',
            'pink-light': 'var(--pink-light)',
            'pink-glow': 'var(--pink-glow)',
            'pink-glow-soft': 'var(--pink-glow-soft)',
          },
          glow: {
            blue: 'var(--glow-blue)',
            purple: 'var(--glow-purple)',
            pink: 'var(--glow-pink)',
            green: 'var(--glow-green)',
          },
          border: {
            glass: 'var(--border-glass)',
            'glass-light': 'var(--border-glass-light)',
          }
        }
      },
      fontFamily: {
        syne: ['var(--font-syne)', 'sans-serif'],
        outfit: ['var(--font-outfit)', 'sans-serif'],
      },
      animation: {
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { opacity: '0.5' },
          '100%': { opacity: '1' },
        }
      },
      animationDelay: {
        '75': '75ms',
        '150': '150ms',
        '500': '500ms',
        '1000': '1000ms',
      }
    },
  },
  plugins: [],
}
export default config