'use client'

import { X } from 'lucide-react'
import { theme } from '@/lib/theme'

interface DonationModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function DonationModal({ isOpen, onClose }: DonationModalProps) {
  if (!isOpen) return null

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
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full transition-all hover:bg-white/10"
        >
          <X size={20} className="text-white/60" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4 flex justify-center">
            {/* Large Coffee Icon */}
            <svg className="w-16 h-16 text-white/80" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {/* Steam lines */}
              <path d="M8 1v3M12 1v3M16 1v3" strokeLinecap="round" opacity="0.6"/>
              {/* Coffee cup */}
              <path d="M17 8h1a3 3 0 0 1 0 6h-1" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 8h14v7a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" strokeLinecap="round" strokeLinejoin="round"/>
              {/* Saucer */}
              <path d="M1 19h18" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            You Like Diceify?
          </h2>
          <p className="text-white/60 text-sm">
            Your support helps keep this tool free for everyone
          </p>
        </div>

        {/* Payment buttons */}
        <div className="space-y-3">
          {/* Venmo Button */}
          <a
            href="https://venmo.com/johnfmikhail?txn=pay&note=🎲%20Support%20Diceify"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl border transition-all hover:scale-105"
            style={{
              backgroundColor: 'rgba(61, 149, 206, 0.1)',
              borderColor: 'rgba(61, 149, 206, 0.3)',
              color: '#3D95CE'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(61, 149, 206, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(61, 149, 206, 0.1)'
            }}
          >
            {/* Venmo Icon */}
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 512 512">
              <path d="M444.17,32H70.28C49.85,32,32,46.7,32,66.89V441.6C32,461.91,49.85,480,70.28,480H444.06C464.6,480,480,461.8,480,441.61V66.89C480.12,46.7,464.6,32,444.17,32ZM278,387H174.32L132.75,138.44l90.75-8.62,22,176.87c20.53-33.45,45.88-86,45.88-121.87,0-19.62-3.36-33-8.61-44L365.4,124.1c9.56,15.78,13.86,32,13.86,52.57C379.25,242.17,323.34,327.26,278,387Z"/>
            </svg>
            <span className="font-medium">Support with Venmo</span>
          </a>

          {/* PayPal Button */}
          <a
            href="https://www.paypal.com/donate/?business=johnfwilliam@gmail.com&item_name=🎲%20Support%20Diceify&currency_code=USD"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl border transition-all hover:scale-105"
            style={{
              backgroundColor: 'rgba(0, 112, 186, 0.1)',
              borderColor: 'rgba(0, 112, 186, 0.3)',
              color: '#0070BA'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 112, 186, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 112, 186, 0.1)'
            }}
          >
            {/* PayPal Icon */}
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 384 512">
              <path d="M111.4 295.9c-3.5 19.2-17.4 108.7-21.5 134-.3 1.8-1 2.5-3 2.5H12.3c-7.6 0-13.1-6.6-12.1-13.9L58.8 46.6c1.5-9.6 10.1-16.9 20-16.9 152.3 0 165.1-3.7 204 11.4 60.1 23.3 65.6 79.5 44 140.3-21.5 62.6-72.5 89.5-140.1 90.3-43.4 .7-69.5-7-75.3 24.2zM357.1 152c-1.8-1.3-2.5-1.8-3 1.3-2 11.4-5.1 22.5-8.8 33.6-39.9 113.8-150.5 103.9-204.5 103.9-6.1 0-10.1 3.3-10.9 9.4-22.6 140.4-27.1 169.7-27.1 169.7-1 7.1 3.5 12.9 10.6 12.9h63.5c8.6 0 15.7-6.3 17.4-14.9 .7-5.4-1.1 6.1 14.4-91.3 4.6-22 14.3-19.7 29.3-19.7 71 0 126.4-28.8 142.9-112.3 6.5-34.8 4.6-71.4-23.8-92.6z"/>
            </svg>
            <span className="font-medium">Support with PayPal</span>
          </a>
        </div>

        {/* Footer text */}
        <p className="text-center text-xs text-white/40 mt-6">
          Thank you for supporting Diceify! 
        </p>
      </div>
    </div>
  )
}