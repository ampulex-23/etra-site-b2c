import React from 'react'
import { ThemeProvider } from './themes/ThemeProvider'
import { PageWrapper } from './components/PageWrapper'
import { ParticleField } from './components/ParticleField'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { BenefitsSection } from './components/BenefitsSection'
import { ScienceSection } from './components/ScienceSection'
import { FlavorsSection } from './components/FlavorsSection'
import { ProcessSection } from './components/ProcessSection'
import { TestimonialsSection } from './components/TestimonialsSection'
import { JoinSection } from './components/JoinSection'
import { Footer } from './components/Footer'

export default function HomePage() {
  return (
    <ThemeProvider>
      <PageWrapper>
        <ParticleField />
        <Header />
        <main style={{ position: 'relative', zIndex: 1 }}>
          <Hero />
          <BenefitsSection />
          <ScienceSection />
          <FlavorsSection />
          <ProcessSection />
          <TestimonialsSection />
          <JoinSection />
        </main>
        <Footer />
      </PageWrapper>
    </ThemeProvider>
  )
}
