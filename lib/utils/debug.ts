/**
 * Utility for development-only console logging
 */

const isDevelopment = process.env.NODE_ENV === 'development'

export const devLog = (...args: any[]) => {
  if (isDevelopment) {
    console.log(...args)
  }
}

export const devError = (...args: any[]) => {
  if (isDevelopment) {
    console.error(...args)
  }
}

export const devWarn = (...args: any[]) => {
  if (isDevelopment) {
    console.warn(...args)
  }
}

export const devInfo = (...args: any[]) => {
  if (isDevelopment) {
    console.info(...args)
  }
}