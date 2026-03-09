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
        <svg style={{ display: 'none' }} xmlns="http://www.w3.org/2000/svg">
          <filter id="pillConcave">
            <feImage
              href="/images/pill-concave.png"
              result="concaveMap"
              preserveAspectRatio="none"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="concaveMap"
              scale="150"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
          <filter id="pillConvex">
            <feImage
              href="/images/pill-convex.png"
              result="convexMap"
              preserveAspectRatio="none"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="convexMap"
              scale="150"
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
