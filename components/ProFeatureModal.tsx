'use client'

import { X, Crown } from 'lucide-react'
import Image from 'next/image'
import { UpgradeButton } from '@/components/UpgradeButton'
import { useEditorStore } from '@/lib/store/useEditorStore'

export default function ProFeatureModal() {
    const showProFeatureModal = useEditorStore(state => state.showProFeatureModal)
    const setShowProFeatureModal = useEditorStore(state => state.setShowProFeatureModal)

    if (!showProFeatureModal) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={() => setShowProFeatureModal(false)}
            />

            {/* Modal */}
            <div className="glass relative w-full max-w-md p-8 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200 border-pink-500/20">
                {/* Glow Effects */}
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-[var(--pink-glow)] rounded-full blur-[80px] pointer-events-none opacity-30" />
                <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-purple-500/20 rounded-full blur-[80px] pointer-events-none opacity-30" />

                {/* Close button */}
                <button
                    onClick={() => setShowProFeatureModal(false)}
                    className="absolute top-4 right-4 p-2 rounded-full transition-all hover:bg-white/10 z-10"
                >
                    <X size={20} className="text-white/60 hover:text-white transition-colors" />
                </button>

                {/* Content */}
                <div className="mb-6 flex flex-col items-center relative z-10">
                    <div className="relative w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-gradient-to-br from-pink-500/20 to-purple-600/20 border border-white/10">
                        <Crown size={32} className="text-pink-400 drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]" />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2">Pro Feature</h2>

                    <p className="text-[var(--text-muted)] text-sm mb-6">
                        SVG download is available exclusively for Pro users.
                        Upgrade to export your dice art as high-quality vectors!
                    </p>

                    <div className="w-full bg-gradient-to-br from-pink-500/10 to-purple-600/10 border border-pink-500/20 rounded-xl p-4 mb-6">
                        <h3 className="text-pink-400 font-semibold mb-2 text-sm uppercase tracking-wide">Pro Benefits</h3>
                        <ul className="text-left text-sm text-gray-300 space-y-2">
                            <li className="flex items-center gap-2">
                                <span className="text-pink-500">✓</span> High-quality SVG Export
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-pink-500">✓</span> Unlimited dice count
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-pink-500">✓</span> Save up to 3 active projects
                            </li>
                        </ul>
                    </div>

                    <UpgradeButton className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 shadow-lg shadow-pink-500/20 text-white font-semibold transition-all hover:scale-[1.02]" />

                    <button
                        onClick={() => setShowProFeatureModal(false)}
                        className="mt-3 text-sm text-gray-500 hover:text-white transition-colors"
                    >
                        Maybe later
                    </button>
                </div>
            </div>
        </div>
    )
}
