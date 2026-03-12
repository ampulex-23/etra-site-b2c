import React from 'react'
import './themes/cyber/theme.css'
import './themes/cyber/effects.css'
import './components/components.css'

export const metadata = {
  title: 'ETRA Project — The Enzyme Revolution',
  description: 'Next-generation enzyme-based probiotic beverages. Science meets taste in every bottle.',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
