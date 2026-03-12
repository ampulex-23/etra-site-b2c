import React from 'react'
import './themes/cyber/theme.css'
import './themes/cyber/effects.css'
import './components/components.css'

export const metadata = {
  title: 'ЭТРА Project — Ферментированные напитки нового поколения',
  description: 'Живые ферменты и пробиотики в каждой бутылке. Натуральная ферментация, лабораторный контроль качества.',
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
