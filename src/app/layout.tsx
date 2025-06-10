import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import dynamic from 'next/dynamic'
import './globals.css'

// Optimize font loading
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter'
})

// Lazy load non-critical components
const ToastProvider = dynamic(() => import('@/components/ui/toaster').then(mod => ({ default: mod.Toaster })), {
  ssr: false
})

const QueryProvider = dynamic(() => import('@/components/providers/QueryProvider'), {
  ssr: false
})

const PerformanceMonitor = dynamic(() => import('@/components/performance/PerformanceMonitor'), {
  ssr: false
})

export const metadata: Metadata = {
  title: 'Analytics Hub - Business Intelligence Dashboard',
  description: 'Comprehensive analytics and business intelligence platform for data-driven insights',
  keywords: ['analytics', 'dashboard', 'business intelligence', 'data visualization'],
  authors: [{ name: 'Analytics Hub Team' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'Analytics Hub',
    description: 'Business Intelligence Dashboard',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Analytics Hub',
    description: 'Business Intelligence Dashboard',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0E0E44" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} ${inter.variable} antialiased`}>
        <QueryProvider>
          <div id="root">
            {children}
          </div>
          <div id="modal-root"></div>
          <div id="tooltip-root"></div>
          <ToastProvider />
          <PerformanceMonitor />
        </QueryProvider>
      </body>
    </html>
  )
}