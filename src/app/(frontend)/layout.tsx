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
        {/* SVG Displacement Filter for glass bottle refraction */}
        <svg style={{ display: 'none' }} xmlns="http://www.w3.org/2000/svg">
          <filter id="bottleGlassFilter" colorInterpolationFilters="sRGB">
            <feImage
              href="/images/bottle-displacement.png"
              result="dispMap"
              preserveAspectRatio="none"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="dispMap"
              scale="35"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </svg>
        {children}
      </body>
    </html>
  )
}
