'use client'

import AuthModal from '@/components/AuthModal'
import { useState } from 'react'
import '../globals.css'

export default function TestAuthPage() {
    const [isOpen, setIsOpen] = useState(true)

    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <h1 className="text-white">Test Page Background</h1>
            <AuthModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                message="This is a test message to verify styling"
            />
        </div>
    )
}
