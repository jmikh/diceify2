'use client'

import Image from 'next/image'

const images = [
    '/images/dali-51x51.png',
    '/images/frida-54x54.png',
    '/images/monalisa.jpg',
    '/images/salah-61x61.png',
    '/images/kobe-71x71.png',
    '/images/sharbatgula-52x52.png',
    '/images/ummkulthum58x58.png',
]

const topRowImages = images.slice(0, 4)
const bottomRowImages = images.slice(4)

// Duplicate images to create a long enough strip for scrolling
// With fewer images per row, we need more repetition to fill the width
const topGalleryImages = [...topRowImages, ...topRowImages, ...topRowImages, ...topRowImages, ...topRowImages, ...topRowImages, ...topRowImages, ...topRowImages]
const bottomGalleryImages = [...bottomRowImages, ...bottomRowImages, ...bottomRowImages, ...bottomRowImages, ...bottomRowImages, ...bottomRowImages, ...bottomRowImages, ...bottomRowImages]

export default function Gallery() {
    return (
        <section className="gallery" id="gallery">
            <div className="gallery-header">
                <div>
                    <span className="section-label">Gallery</span>
                    <h2>Made with Diceify</h2>
                </div>
            </div>

            {/* Top Row - Scrolls Left */}
            <div className="gallery-marquee">
                <div className="gallery-row top">
                    {topGalleryImages.map((src, i) => (
                        <div key={`top-${i}`} className="gallery-item relative">
                            <Image
                                src={src}
                                alt={`Gallery item ${i}`}
                                fill
                                className="object-cover"
                                sizes="280px"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Row - Scrolls Right */}
            <div className="gallery-marquee">
                <div className="gallery-row bottom">
                    {bottomGalleryImages.map((src, i) => (
                        <div key={`bottom-${i}`} className="gallery-item relative">
                            <Image
                                src={src}
                                alt={`Gallery item ${i}`}
                                fill
                                className="object-cover"
                                sizes="280px"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
