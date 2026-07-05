import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { ThemeProvider } from 'next-themes'
import { QueryProvider } from '@/components/shared/QueryProvider'
import { CartProvider } from '@/components/cart/CartContext'
import { SplashScreen } from '@/components/shared/SplashScreen'
import { SessionTracker } from '@/components/shared/SessionTracker'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'HolaMate', template: '%s — HolaMate' },
  description: 'Khám phá ẩm thực Hòa Lạc — quán ăn, gian hàng sinh viên, review minh bạch và đặt món dễ dàng.',
  metadataBase: new URL('https://holamate.vercel.app'),
  icons: { icon: '/logo-icon.png', apple: '/logo-icon.png' },
  openGraph: {
    title: 'HolaMate',
    description: 'Khám phá ẩm thực Hòa Lạc — quán ăn, gian hàng sinh viên, review minh bạch và đặt món dễ dàng.',
    images: [{ url: '/logo.jpg', width: 100, height: 100, alt: 'HolaMate' }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={GeistSans.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <SplashScreen />
          <SessionTracker />
          <CartProvider>
            <QueryProvider>{children}</QueryProvider>
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
