import Link from 'next/link'
import { theme } from '@/lib/theme'

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: theme.colors.background.primary }}>
      <div className="text-center max-w-2xl">
        <h1 className="text-6xl font-bold text-white mb-6">
          Dice Art Generator
        </h1>
        <p className="text-xl text-gray-300 mb-12">
          Transform your photos into stunning dice art. Upload an image, crop it perfectly, 
          and watch as it becomes a beautiful mosaic of dice.
        </p>
        <Link 
          href="/editor"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors"
        >
          Start Creating
        </Link>
        
        <div className="mt-16 grid grid-cols-3 gap-4 text-gray-400">
          <div>
            <div className="text-3xl mb-2">📷</div>
            <div className="font-semibold">Upload</div>
            <div className="text-sm">Any image format</div>
          </div>
          <div>
            <div className="text-3xl mb-2">✂️</div>
            <div className="font-semibold">Crop</div>
            <div className="text-sm">Perfect framing</div>
          </div>
          <div>
            <div className="text-3xl mb-2">🎲</div>
            <div className="font-semibold">Generate</div>
            <div className="text-sm">Instant dice art</div>
          </div>
        </div>
      </div>
    </main>
  )
}