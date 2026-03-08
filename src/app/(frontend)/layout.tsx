import React from 'react'
import './themes/cyber/theme.css'
import './themes/cyber/effects.css'
import './components/components.css'

export const metadata = {
  title: 'ЭТРА Project — The Enzyme Revolution',
  description: 'Ферментированные напитки с пробиотиками нового поколения. Enzyme-based beverages.',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="ru">
      <body>
        {children}
      </body>
    </html>
  )
}
