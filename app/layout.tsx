import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import Providers from '@/components/Providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://diceify.art'),
  title: {
    default: 'Diceify - Dice Mosaic Art Creator',
    template: '%s | Diceify'
  },
  description: 'Create stunning physical dice mosaics from your digital photos. Transform any image into buildable dice art with our free online tool.',
  keywords: ['dice art', 'mosaic maker', 'photo to dice', 'dice mosaic', 'image converter', 'art generator', 'creative tools'],
  authors: [{ name: 'Diceify' }],
  creator: 'Diceify',
  publisher: 'Diceify',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'Diceify - Transform Photos into Dice Mosaic Art',
    description: 'Create stunning physical dice mosaics from your digital photos. Transform any image into buildable dice art with our free online tool.',
    url: 'https://diceify.art',
    siteName: 'Diceify',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Diceify - Transform Photos into Dice Art',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Diceify - Transform Photos into Dice Mosaic Art',
    description: 'Create stunning physical dice mosaics from your digital photos.',
    images: ['/twitter-image'],
    creator: '@diceify',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      {
        url: '/favicon.ico',
        type: 'image/x-icon',
      },
      {
        url: '/favicon-16x16.png',
        type: 'image/png',
        sizes: '16x16',
      },
      {
        url: '/favicon-32x32.png',
        type: 'image/png',
        sizes: '32x32',
      },
      {
        url: '/favicon-48x48.png',
        type: 'image/png',
        sizes: '48x48',
      },
      {
        url: '/favicon-64x64.png',
        type: 'image/png',
        sizes: '64x64',
      },
      {
        url: '/favicon-96x96.png',
        type: 'image/png',
        sizes: '96x96',
      },
      {
        url: '/favicon-192x192.png',
        type: 'image/png',
        sizes: '192x192',
      },
      {
        url: '/favicon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.ico',
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: 'https://diceify.art',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}