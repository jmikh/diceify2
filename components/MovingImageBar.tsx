'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'

const images = [
  '/images/dali-51x51.png',
  '/images/frida-54x54.png',
  '/images/monalisa.jpg',
  '/images/salah-61x61.png',
  '/images/kobe-71x71.png',
  '/images/sharbatgula-52x52.png',
  '/images/ummkulthum58x58.png',
]

export default function MovingImageBar() {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scrollContainer = scrollRef.current
    if (!scrollContainer) return

    let animationFrameId: number
    let scrollPosition = 0

    const animate = () => {
      scrollPosition += 0.5 // Adjust speed here

      // Reset when first set of images is fully scrolled
      if (scrollPosition >= scrollContainer.scrollWidth / 2) {
        scrollPosition = 0
      }

      scrollContainer.scrollLeft = scrollPosition
      animationFrameId = requestAnimationFrame(animate)
    }

    animationFrameId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/50 z-10" />

      {/* Moving images container */}
      <div
        ref={scrollRef}
        className="absolute inset-0 flex items-center overflow-x-hidden"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)'
        }}
      >
        <div className="flex gap-8 px-8">
          {/* Duplicate images for seamless loop */}
          {[...images, ...images].map((src, index) => (
            <div
              key={index}
              className="relative flex-shrink-0 opacity-60"
              style={{
                width: '400px',
                height: '400px'
              }}
            >
              <Image
                src={src}
                alt={`Dice art example ${index + 1}`}
                fill
                className="object-cover rounded-lg"
                sizes="400px"
                priority={index < 4}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}