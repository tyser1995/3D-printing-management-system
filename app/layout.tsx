import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import Providers from './providers'
import PageTracker from '@/components/layout/PageTracker'
import { Analytics } from '@vercel/analytics/next'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Kai3D | 3D Printing',
    template: '%s | Kai3D',
  },
  description:
    'Professional 3D printing management platform — shop, order, and track custom 3D printed products.',
  keywords: ['3D printing', '3D prints', 'custom 3D', 'Kai3D', 'Philippines'],
  authors: [{ name: 'Kai3D' }],
  openGraph: {
    type: 'website',
    locale: 'en_PH',
    siteName: 'Kai3D',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full`}>
      <body className="flex min-h-full flex-col antialiased">
        <Providers>
          <PageTracker />
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
