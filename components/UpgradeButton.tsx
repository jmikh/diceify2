"use client"

import { useState } from "react"

interface UpgradeButtonProps {
    className?: string
}

export const UpgradeButton = ({ className }: UpgradeButtonProps) => {
    const [isLoading, setIsLoading] = useState(false)

    const onUpgrade = async () => {
        try {
            setIsLoading(true)
            const response = await fetch("/api/stripe/checkout", {
                method: "POST",
            })

            if (!response.ok) {
                throw new Error("Something went wrong")
            }

            const data = await response.json()
            window.location.href = data.url
        } catch (error) {
            console.error("Billing Error:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <button
            onClick={onUpgrade}
            disabled={isLoading}
            className={`inline-flex items-center justify-center gap-2 font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        >
            {isLoading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                </>
            ) : (
                <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Upgrade to Pro
                </>
            )}
        </button>
    )
}
