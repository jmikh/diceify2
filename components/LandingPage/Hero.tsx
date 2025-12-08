'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function Hero() {
    return (
        <section className="hero">
            <div className="hero-content">
                <div className="hero-badge">
                    <span className="dot"></span>
                    Transform photos into buildable art
                </div>
                <h1>Turn photos into <span className="highlight">dice art</span></h1>
                <p>Upload a photo, tune the contrast and detail, then follow our step-by-step guide to build stunning mosaic art using standard dice.</p>
                <div className="hero-buttons">
                    <Link href="/editor" className="btn-primary">
                        Start creating
                    </Link>
                    <Link href="#how" className="btn-secondary">
                        How it works
                    </Link>
                </div>
            </div>
            <div className="hero-visual relative h-[500px] w-full max-w-[500px] mx-auto lg:mr-0">
                <div className="absolute top-0 right-10 w-[240px] h-[240px] z-10 rounded-[1.25rem] overflow-hidden rotate-[-3deg] hover:rotate-[-6deg] transition-all duration-300 border border-white/10 shadow-2xl hover:z-20 hover:scale-105">
                    <Link
                        href="https://www.youtube.com/watch?v=z4UUXeYqJZw"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full h-full relative"
                    >
                        <Image
                            src="/images/build-real.jpg"
                            alt="Building dice art close up"
                            fill
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none" />
                    </Link>
                </div>
                <div className="absolute bottom-10 left-10 w-[260px] h-[300px] z-0 rounded-[1.25rem] overflow-hidden rotate-[3deg] hover:rotate-[6deg] transition-all duration-300 border border-white/10 shadow-2xl hover:z-20 hover:scale-105">
                    <Link
                        href="https://jeremyklammer.com/2023/11/21/dice-art/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full h-full relative"
                    >
                        <Image
                            src="/hero-2.png"
                            alt="Dice art workspace"
                            fill
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none" />
                    </Link>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-500/20 blur-[100px] rounded-full -z-10" />
            </div>
        </section>
    )
}
