import ScrollWorkflowDemo from '@/components/ScrollWorkflowDemo'
import Link from 'next/link'
import { theme } from '@/lib/theme'

export default function Home() {
  return (
    <div style={{ backgroundColor: theme.colors.background.primary }}>
      {/* Interactive scroll demo */}
      <ScrollWorkflowDemo />
      
      {/* Additional content after the demo */}
      <section className="py-20 px-4 text-center min-h-screen flex items-center justify-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold text-white mb-8">
            Ready to Create Your Own?
          </h2>
          <p className="text-xl text-gray-300 mb-12 leading-relaxed">
            Join thousands of artists and creators who are transforming their photos 
            into stunning dice art masterpieces. Start your journey today.
          </p>
          
          <Link 
            href="/editor"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-6 px-12 rounded-full text-xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
          >
            Launch Editor
          </Link>
          
          <div className="mt-20 grid md:grid-cols-3 gap-8 text-gray-300">
            <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
              <div className="text-6xl mb-6">🎨</div>
              <h3 className="text-2xl font-semibold text-white mb-4">Creative Freedom</h3>
              <p className="leading-relaxed">
                Full control over your dice art with advanced parameters. 
                Adjust grid size, contrast, and color modes to match your vision.
              </p>
            </div>
            
            <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
              <div className="text-6xl mb-6">⚡</div>
              <h3 className="text-2xl font-semibold text-white mb-4">Lightning Fast</h3>
              <p className="leading-relaxed">
                Real-time preview and instant generation. See your changes 
                as you make them with our optimized rendering engine.
              </p>
            </div>
            
            <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
              <div className="text-6xl mb-6">📱</div>
              <h3 className="text-2xl font-semibold text-white mb-4">Works Everywhere</h3>
              <p className="leading-relaxed">
                Create dice art on any device. Our responsive design 
                ensures a perfect experience on desktop, tablet, and mobile.
              </p>
            </div>
          </div>
          
          <div className="mt-20 p-8 rounded-3xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-white/10">
            <h3 className="text-3xl font-bold text-white mb-4">
              From Photo to Physical Art
            </h3>
            <p className="text-lg text-gray-300 leading-relaxed">
              Calculate materials needed and get a roadmap to build your dice art in the real world. 
              Our smart estimator tells you exactly how many dice you'll need and the total cost.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}