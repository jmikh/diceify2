'use client'

import { useState } from 'react'
import DonationModal from './DonationModal'

export default function Footer() {
  const [showDonationModal, setShowDonationModal] = useState(false)

  return (
    <>
      <footer id="about" className="relative z-10 py-6 px-6 md:px-24 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-[var(--border-glass)]">
        <p className="text-[var(--text-dim)] text-sm">&copy; 2025 Diceify. Made for makers.</p>

        <div className="flex items-center gap-6">
          {/* Buy Me Coffee Button */}
          <button
            onClick={() => setShowDonationModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-white/80 hover:text-white">
            {/* Coffee Cup Icon with Steam */}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {/* Steam lines */}
              <path d="M8 1v3M12 1v3M16 1v3" strokeLinecap="round" opacity="0.6" />
              {/* Coffee cup */}
              <path d="M17 8h1a3 3 0 0 1 0 6h-1" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 8h14v7a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" strokeLinecap="round" strokeLinejoin="round" />
              {/* Saucer */}
              <path d="M1 19h18" strokeLinecap="round" />
            </svg>
            <span className="text-sm font-medium">Buy me a coffee</span>
          </button>

          <ul className="flex gap-4 list-none">

            <li>
              <a
                href="https://www.linkedin.com/in/john-mikhail/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--text-dim)] text-sm no-underline hover:text-[var(--pink)] transition-colors"
              >
                LinkedIn
              </a>
            </li>
          </ul>
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