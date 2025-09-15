import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import Providers from '@/components/Providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://diceify.art'),
  title: {
    default: 'Diceify - Transform Photos into Dice Mosaic Art',
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
        url: '/favicon.svg',
        type: 'image/svg+xml',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      }
    ],
    shortcut: '/favicon.svg',
    apple: '/icon.svg',
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