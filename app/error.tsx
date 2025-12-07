'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-3xl font-bold mb-2">Something went wrong!</h1>
          <p className="text-gray-400">
            An unexpected error occurred. We apologize for the inconvenience.
          </p>
          {process.env.NODE_ENV === 'development' && error.message && (
            <div className="mt-4 p-4 bg-gray-800 rounded-lg text-left">
              <p className="text-xs text-red-400 font-mono break-all">
                {error.message}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <button
            onClick={reset}
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="block w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Back to Home
          </Link>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-700">
          <p className="text-sm text-gray-500">
            If this error persists, please contact support.
          </p>
        </div>
      </div>
    </div>
  )
}