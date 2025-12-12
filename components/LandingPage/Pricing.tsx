"use client"
import Link from 'next/link'
import { Check, Loader2, Sparkles } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getSession, SessionProvider } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
import AuthModal from '@/components/AuthModal'
import SessionRefresher from '@/components/SessionRefresher'

export default function Pricing() {
    // Removed useSession hook to prevent fetch on load
    const [isLoading, setIsLoading] = useState(false)
    const [showAuthModal, setShowAuthModal] = useState(false)
    const [showAlreadyProModal, setShowAlreadyProModal] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)

    const searchParams = useSearchParams()
    const router = useRouter()

    // URL cleanup handling moved to SessionRefresher to avoid race conditions


    const onUpgrade = async () => {
        setIsLoading(true)
        const session = await getSession()

        if (!session) {
            setIsLoading(false)
            setShowAuthModal(true)
            return
        }

        try {
            // Check fresh subscription status
            const statusResponse = await fetch("/api/user/subscription")
            if (statusResponse.ok) {
                const { isPro } = await statusResponse.json()
                if (isPro) {
                    setShowAlreadyProModal(true)
                    setIsLoading(false)
                    return
                }
            }

            const response = await fetch("/api/stripe/checkout", {
                method: "POST",
            })

            if (!response.ok) {
                const errorText = await response.text()
                console.error("Server Error Response:", errorText)
                throw new Error(errorText || "Something went wrong")
            }

            const data = await response.json()
            window.location.href = data.url
        } catch (error) {
            console.error("Billing Error:", error)
            setIsLoading(false)
        }
    }

    return (
        <section className="py-24 px-6 relative" id="pricing">
            {/* Session Refresher - only active when coming back from success */}
            {searchParams?.get('success') && (
                <SessionProvider>
                    <SessionRefresher onComplete={() => setShowSuccessModal(true)} />
                </SessionProvider>
            )}

            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                message="Sign in to upgrade to Pro and unlock unlimited features."
            />

            {/* Already Pro Modal */}
            {showAlreadyProModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#0f0f12] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mb-4">
                                <Check size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">You're already a Pro!</h3>
                            <p className="text-gray-400 mb-6">
                                You have lifetime access to all premium features. No need to pay again.
                            </p>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setShowAlreadyProModal(false)}
                                    className="flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
                                >
                                    Close
                                </button>
                                <Link
                                    href="/editor"
                                    className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-medium transition-all text-center"
                                >
                                    Go to Editor
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#0f0f12] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden">
                        {/* Confetti/Sparkles effect background */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-pink-500/10 pointer-events-none" />

                        <div className="flex flex-col items-center text-center relative z-10">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 text-pink-400 flex items-center justify-center mb-6 animate-in zoom-in duration-300 delay-150">
                                <Sparkles size={32} />
                            </div>
                            <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70 mb-2">Welcome to Pro!</h3>
                            <p className="text-gray-400 mb-8 max-w-[280px]">
                                Your upgrade was successful. You now have lifetime access to all premium features.
                            </p>

                            <Link
                                href="/editor"
                                className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-500/20 text-center"
                            >
                                Start Creating
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold font-syne mb-6">Simple, Transparent Pricing</h2>
                    <p className="text-lg text-white/50 max-w-2xl mx-auto">
                        Start creating for free. Upgrade when you're ready to build massive masterpieces.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-start">
                    {/* Free Plan */}
                    <div className="glass p-8 md:p-10 rounded-[2rem] relative">
                        <div className="mb-8">
                            <h3 className="text-2xl font-bold mb-2">Hobbyist</h3>
                            <div className="text-3xl font-bold mb-4">Free</div>
                            <p className="text-white/50">Perfect for trying out dice art and sharing on social media.</p>
                        </div>

                        <ul className="space-y-4 mb-8">
                            <li className="flex items-start gap-3 text-white/80">
                                <Check className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                                <span>Builder supports up to 1k dice</span>
                            </li>
                            <li className="flex items-start gap-3 text-white/80">
                                <Check className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                                <span>Social-ready downloads (Low Res)</span>
                            </li>
                            <li className="flex items-start gap-3 text-white/80">
                                <Check className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                                <span>Save 1 active project in the cloud</span>
                            </li>

                        </ul>

                        <Link href="/editor" className="btn-secondary w-full justify-center">
                            Start Creating Free
                        </Link>
                    </div>

                    {/* Pro Plan */}
                    <div className="glass p-8 md:p-10 rounded-[2rem] relative border-pink-500/30 overflow-hidden group">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent opacity-50"></div>
                        <div className="absolute -top-[100px] left-1/2 -translate-x-1/2 w-[200px] h-[200px] bg-pink-500/20 blur-[80px] rounded-full pointer-events-none group-hover:bg-pink-500/30 transition-colors duration-500"></div>

                        <div className="mb-8 relative z-10">
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-2xl font-bold">Pro</h3>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-bold uppercase tracking-wider">
                                    Most Popular
                                </div>
                            </div>
                            <div className="flex items-baseline gap-1 mb-4">
                                <span className="text-4xl font-bold">$19</span>
                                <span className="text-white/50">one-time</span>
                            </div>
                            <p className="text-white/50">Everything you need to build professional-grade physical dice mosaics.</p>
                        </div>

                        <ul className="space-y-4 mb-8 relative z-10">
                            <li className="flex items-start gap-3 text-white/90">
                                <Check className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
                                <span>Builder supports <strong>unlimited</strong> dice</span>
                            </li>
                            <li className="flex items-start gap-3 text-white/90">
                                <Check className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
                                <span>Full resolution SVG downloads</span>
                            </li>
                            <li className="flex items-start gap-3 text-white/90">
                                <Check className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
                                <span>Save 3 active projects in the cloud</span>
                            </li>

                        </ul>

                        <button
                            onClick={onUpgrade}
                            disabled={isLoading}
                            className="btn-primary w-full justify-center relative z-10"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                "Get Lifetime Access"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    )
}

