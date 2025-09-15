import Link from 'next/link'
import Logo from '@/components/Logo'
import MovingImageBar from '@/components/MovingImageBar'
import { theme } from '@/lib/theme'
import Script from 'next/script'

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Diceify",
    "description": "Transform photos into dice mosaic art. Create stunning physical dice mosaics from your digital photos with our free online tool.",
    "url": "https://diceify.art",
    "applicationCategory": "DesignApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "42"
    },
    "creator": {
      "@type": "Organization",
      "name": "Diceify",
      "url": "https://diceify.art"
    }
  }

  return (
    <>
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div style={{ backgroundColor: theme.colors.background.primary, minHeight: '100vh' }}>
        <MovingImageBar />
      
      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-4xl mx-auto">
          <div className="mb-8">
            <Logo />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Transform Photos into <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">Dice Mosaic</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed">
            Helps build real dice mosaic art from your digitial photos.
          </p>
          
          <Link 
            href="/editor"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-6 px-12 rounded-full text-xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
          >
            Start Creating
          </Link>
        </div>
      </section>
      
      
      {/* Footer */}
      <footer className="relative z-10 py-8 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto text-center text-gray-400">
          <p>&copy; 2025 Diceify</p>
        </div>
      </footer>
      </div>
    </>
  )
}