import React from 'react'
import Script from 'next/script'
import './pwa.css'
import { CartProvider } from './cart/CartProvider'
import { AuthProvider } from './auth/AuthProvider'
import { PwaShell } from './pwa/PwaShell'

export const metadata = {
  title: 'ЭТРА — Ферментированные напитки',
  description: 'Живые ферменты и пробиотики в каждой бутылке.',
  manifest: '/manifest.json',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover' as const,
  themeColor: '#0a1a14',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="ru">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/images/logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Script src="/glass-filters.js" strategy="beforeInteractive" />
        <AuthProvider>
          <CartProvider>
            <PwaShell>{children}</PwaShell>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
