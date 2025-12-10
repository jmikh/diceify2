'use client'

import Image from 'next/image'

const galleryItems = [
    { src: '/images/dali-51x51.png', alt: 'Salvador Dali dice art mosaic' },
    { src: '/images/frida-54x54.png', alt: 'Frida Kahlo portrait made of dice' },
    { src: '/images/monalisa.jpg', alt: 'Mona Lisa dice mosaic art' },
    { src: '/images/salah-61x61.png', alt: 'Mo Salah football player dice art' },
    { src: '/images/kobe-71x71.png', alt: 'Kobe Bryant tribute in dice' },
    { src: '/images/sharbatgula-52x52.png', alt: 'Afghan Girl famous portrait in dice' },
    { src: '/images/ummkulthum58x58.png', alt: 'Umm Kulthum singer dice mosaic' },
]

const topRowItems = galleryItems.slice(0, 4)
const bottomRowItems = galleryItems.slice(4)

// Duplicate images to create a long enough strip for scrolling
const topGalleryItems = [...topRowItems, ...topRowItems, ...topRowItems, ...topRowItems, ...topRowItems, ...topRowItems]
const bottomGalleryItems = [...bottomRowItems, ...bottomRowItems, ...bottomRowItems, ...bottomRowItems, ...bottomRowItems, ...bottomRowItems]

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
                    {topGalleryItems.map((item, i) => (
                        <div key={`top-${i}`} className="gallery-item relative">
                            <Image
                                src={item.src}
                                alt={item.alt}
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
                    {bottomGalleryItems.map((item, i) => (
                        <div key={`bottom-${i}`} className="gallery-item relative">
                            <Image
                                src={item.src}
                                alt={item.alt}
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
