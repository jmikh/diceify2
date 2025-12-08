'use client'

import Link from 'next/link'

export default function Navbar() {
    return (
        <nav className="fixed top-6 left-1/2 -translate-x-1/2 p-3 px-4 flex justify-between items-center gap-12 z-[100] bg-white/5 backdrop-blur-[20px] border border-white/10 rounded-full">
            <div className="font-syne font-bold text-xl tracking-tight pl-3">
                Dice<span className="text-[var(--pink)]">ify</span>
            </div>
            <ul className="hidden md:flex gap-2 list-none">
                <li>
                    <Link href="#how" className="text-[var(--text-muted)] text-sm font-medium px-4 py-2 rounded-full transition-all hover:text-white hover:bg-white/5 no-underline">
                        How it works
                    </Link>
                </li>
                <li>
                    <Link href="#gallery" className="text-[var(--text-muted)] text-sm font-medium px-4 py-2 rounded-full transition-all hover:text-white hover:bg-white/5 no-underline">
                        Gallery
                    </Link>
                </li>
                <li>
                    <Link href="#about" className="text-[var(--text-muted)] text-sm font-medium px-4 py-2 rounded-full transition-all hover:text-white hover:bg-white/5 no-underline">
                        About
                    </Link>
                </li>
            </ul>
            <Link href="/editor" className="nav-cta">
                Start creating
            </Link>
        </nav>
    )
}
