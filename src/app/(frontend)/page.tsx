import React from 'react'
import { ThemeProvider } from './themes/ThemeProvider'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { SectionScience } from './components/SectionScience'
import { SectionFlavors } from './components/SectionFlavors'
import { SectionJoin } from './components/SectionJoin'
import { Footer } from './components/Footer'

export default function HomePage() {
  return (
    <ThemeProvider>
      <Header />
      <main>
        <Hero />
        <SectionScience />
        <SectionFlavors />
        <SectionJoin />
      </main>
      <Footer />
    </ThemeProvider>
  )
}
