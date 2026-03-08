import React from 'react'
import { ThemeProvider } from './themes/ThemeProvider'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { CyberVoid } from './components/CyberVoid'

export default function HomePage() {
  return (
    <ThemeProvider>
      <Header />
      <main>
        <Hero />
        <CyberVoid />
      </main>
    </ThemeProvider>
  )
}
