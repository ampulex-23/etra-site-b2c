import React from 'react'
import './pwa.css'
import './themes/aloe/theme.css'
import './themes/aloe/effects.css'
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
  themeColor: '#f8fdf8',
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
        <link href="https://fonts.googleapis.com/css2?family=Philosopher:wght@400;700&family=Tenor+Sans&display=swap" rel="stylesheet" />
      </head>
      <body>
        {/* Liquid Glass SVG Filter with proper displacement map */}
        <svg 
          style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
          dangerouslySetInnerHTML={{
            __html: `
              <defs>
                <filter id="liquidGlassFilter" x="0%" y="0%" width="100%" height="100%" color-interpolation-filters="sRGB">
                  <feImage 
                    href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAECElEQVR42u2bV3PbQAyE76e79957793+g8lwOOvbLIHjmaKdZHgP+yJRtvbDAqAkMoyNjf0assJP/JPx8aiJiXbx8f8tADY7OVlraqrW9LQvHIPXMJR/HoCaZrMzM7VmZ9uFYxnKd8EIfRpn02x4bq7W/HzUwkJT/Dxeo0AYRh8gRgZgGYdpNru4GLW05IuPYygMQ0H8FQCoumccpmFsebnWysqfWl1tPoZjGQpgWCBGSUPoah5VTxmH4cpkpbW1qPX1pvh5vAZAUiCQhi4QQtfIo+pq3DINgxsbtTY3feEYhqIwFATS0KUlwlfNI/KoOlccxmGaDW9t1drebheOVSCAUf0fTgTSwC3ROwCYR+RRdY46G1fTOzu1dnej9vai+HEca8EACG4NpIFbIhdC6Greqjobh2k1u79f6+CgKTynUBgGQFhp6AIh9GGeq87G1fDhYdTRUVP8vAJhEJyGUSGEnGmPnlfziDxXnY2zaZg8Pq51ctIUnlMggAEQnAZuCYWAwZjaDqEv81x1GGfTMHl6WuvsrCk8x0AYRvV3OQ19QAg50ce0t8wj8lp1Ns6Gz8+jLi6i+HEGwiA0DdwSCgHboa0VwlfNo+ct855xNXx56UuBeCA8CDwTciCE3OhXK4fNI/aWeTbOpq+ual1f+8IxCgMgPAjcDtX7xAlTWyuEr0a/mr6eea06G4fBm5uo29sofpxhAISmwYOAFZmbgpBTfTaP6FeDyDPvGYfZuztfDMQC4UHAduDzhOp9t6UgtFVfo8+rrhpIGns1D+MweH8f9fAQxY8zDICwIKAdeDvoPKjefyoFDQCp6nP0Me1zzavpx8emFEYuBF6RVitoCkwAiL/2vlV9jT56PmWeTT89+WIYKQiYCalWQAp0FnAbBCv+Ovmt6nP0MfDUvFYcJp+ffTEIToRCwGC0WoFToBtB2yB48bcmv1d9RF8rr+Zh8uXFF4NgCJoEbgUrBdZGsNog6PTPjb9XfSv2MA+Tr6++GARD4HbwUpDbBrwNgtX/euJjxV97H9XPNf/21lQuBE6BzgJtAz0x0jnwCcDqf2v6W/G3qu+ZV9Pv7zYIC4KXAm0DaxtYc+ATAAagt/5y4q+DTwGw+cq0J4VgpQCzIKcNvHWIQRjaBmBb/3vxV/MAkDLPELgdACHVBqk5kBqEDQB87q8DMLf/c6r/8dFUTgpy54AOQv5s0AmANQB5/fHq+04AvBK9dYhBOBIAXYF9AOCYpwBwG/QFgFdhSUCZAQkAg90Cgz4PGPyZYPksMPRPg4P/PqB8I1S+EyzfCpffBcovQ+W3wfLrcLk+oFwhUq4RKleJlesEy5Wi5VrhcrV4uV+g3DFS7hkqd42V+wbLnaPl3uFh3D3+G5TWOHu/q396AAAAAElFTkSuQmCC"
                    x="0%" y="0%" width="100%" height="100%"
                    preserveAspectRatio="none"
                    result="displacementMap"
                  />
                  <feDisplacementMap
                    in="SourceGraphic"
                    in2="displacementMap"
                    scale="30"
                    xChannelSelector="R"
                    yChannelSelector="G"
                  />
                </filter>
              </defs>
            `
          }}
        />
        <AuthProvider>
          <CartProvider>
            <PwaShell>{children}</PwaShell>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
