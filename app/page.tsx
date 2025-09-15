import Link from 'next/link'
import Logo from '@/components/Logo'
import MovingImageBar from '@/components/MovingImageBar'
import { theme } from '@/lib/theme'

export default function Home() {
  return (
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
            Diceify custom builder to helps build real dice mosaic from your digitial version.
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
  )
}