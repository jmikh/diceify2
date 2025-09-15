import Link from 'next/link'
import Logo from '@/components/Logo'
import AnimatedDiceBackground from '@/components/AnimatedDiceBackground'
import { theme } from '@/lib/theme'

export default function Home() {
  return (
    <div style={{ backgroundColor: theme.colors.background.primary, minHeight: '100vh' }}>
      <AnimatedDiceBackground />
      
      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-4xl mx-auto">
          <div className="mb-8">
            <Logo />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Transform Photos into <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">Dice Art</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed">
            Create stunning mosaic art using dice. Upload your photo, adjust the settings, 
            and watch as your image transforms into a unique piece of dice art.
          </p>
          
          <Link 
            href="/editor"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-6 px-12 rounded-full text-xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
          >
            Start Creating
          </Link>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            Everything You Need to Create Amazing Dice Art
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
              <div className="text-5xl mb-6">📸</div>
              <h3 className="text-2xl font-semibold text-white mb-4">Easy Upload</h3>
              <p className="text-gray-300 leading-relaxed">
                Simply drag and drop your photo or click to browse. 
                Support for all major image formats.
              </p>
            </div>
            
            <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
              <div className="text-5xl mb-6">✂️</div>
              <h3 className="text-2xl font-semibold text-white mb-4">Precise Cropping</h3>
              <p className="text-gray-300 leading-relaxed">
                Crop and zoom your image to focus on what matters most. 
                Multiple aspect ratio options available.
              </p>
            </div>
            
            <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
              <div className="text-5xl mb-6">🎨</div>
              <h3 className="text-2xl font-semibold text-white mb-4">Fine Tuning</h3>
              <p className="text-gray-300 leading-relaxed">
                Adjust grid size, contrast, and color modes. 
                See changes in real-time with instant preview.
              </p>
            </div>
            
            <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
              <div className="text-5xl mb-6">🎲</div>
              <h3 className="text-2xl font-semibold text-white mb-4">Build Simulation</h3>
              <p className="text-gray-300 leading-relaxed">
                Interactive viewer shows exactly how to build your art 
                one die at a time.
              </p>
            </div>
            
            <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
              <div className="text-5xl mb-6">💾</div>
              <h3 className="text-2xl font-semibold text-white mb-4">Export Options</h3>
              <p className="text-gray-300 leading-relaxed">
                Download your dice art as high-resolution images 
                ready for printing or sharing.
              </p>
            </div>
            
            <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
              <div className="text-5xl mb-6">📊</div>
              <h3 className="text-2xl font-semibold text-white mb-4">Material Calculator</h3>
              <p className="text-gray-300 leading-relaxed">
                Know exactly how many dice you need and the total cost 
                to build your art physically.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-white/10 backdrop-blur-sm">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Create Your Masterpiece?
            </h2>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Join thousands of artists transforming photos into stunning dice art. 
              No experience needed - our intuitive editor guides you through every step.
            </p>
            <Link 
              href="/editor"
              className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-6 px-12 rounded-full text-xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
            >
              Launch Editor
            </Link>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="relative z-10 py-8 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto text-center text-gray-400">
          <p>&copy; 2024 Dice Art Generator. Transform your photos into art.</p>
        </div>
      </footer>
    </div>
  )
}