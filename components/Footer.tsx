'use client'

import { useState } from 'react'
import DonationModal from './DonationModal'

export default function Footer() {
  const [showDonationModal, setShowDonationModal] = useState(false)

  return (
    <>
      <footer className="relative z-10 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-400">&copy; 2025 Diceify</p>

            {/* Buy Me Coffee Button */}
            <button
              onClick={() => setShowDonationModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-all text-white/80 hover:text-white">
            {/* Coffee Cup Icon with Steam */}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {/* Steam lines */}
              <path d="M8 1v3M12 1v3M16 1v3" strokeLinecap="round" opacity="0.6"/>
              {/* Coffee cup */}
              <path d="M17 8h1a3 3 0 0 1 0 6h-1" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 8h14v7a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" strokeLinecap="round" strokeLinejoin="round"/>
              {/* Saucer */}
              <path d="M1 19h18" strokeLinecap="round"/>
            </svg>
            <span className="text-sm font-medium">Buy me a coffee</span>
          </button>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            {/* YouTube */}
            <a
              href="https://www.youtube.com/watch?v=z4UUXeYqJZw&t=3s&ab_channel=JohnMikhail"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-white transition-colors"
              aria-label="YouTube"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>

            {/* LinkedIn */}
            <a
              href="https://www.linkedin.com/in/john-mikhail/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-white transition-colors"
              aria-label="LinkedIn"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>

    {/* Donation Modal */}
    <DonationModal
      isOpen={showDonationModal}
      onClose={() => setShowDonationModal(false)}
    />
    </>
  )
}