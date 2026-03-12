export const dynamic = 'force-dynamic'

import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
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

async function getLandingData() {
  try {
    const payload = await getPayload({ config })

    const landing = await payload.findGlobal({ slug: 'landing-settings' }).catch(() => null)

    const productsQuery = await payload.find({
      collection: 'products',
      where: {
        status: { equals: 'active' },
        ...(landing?.catalogShowFeatured !== false ? { featured: { equals: true } } : {}),
      },
      limit: (landing?.catalogMaxItems as number) || 6,
      sort: '-createdAt',
    }).catch(() => null)

    const products = productsQuery?.docs?.map((p: any) => {
      const firstImage = p.images?.[0]?.image
      let imageUrl: string | null = null
      if (firstImage) {
        if (typeof firstImage === 'string') {
          imageUrl = firstImage
        } else if (firstImage.url) {
          imageUrl = firstImage.url
        }
      }

      return {
        id: String(p.id),
        title: p.title,
        slug: p.slug,
        shortDescription: p.shortDescription || undefined,
        price: p.price,
        oldPrice: p.oldPrice || undefined,
        imageUrl,
        featured: p.featured || false,
        inStock: p.inStock !== false,
      }
    }) || []

    return { landing, products }
  } catch {
    return { landing: null, products: [] }
  }
}

function getMediaUrl(media: any): string | null {
  if (!media) return null
  if (typeof media === 'string') return media
  return media.url || null
}

export default async function HomePage() {
  const { landing, products } = await getLandingData()

  const heroBgUrl = getMediaUrl(landing?.heroBgImage)

  const scienceImageUrl = getMediaUrl(landing?.scienceImage)
  const scienceFeatures = (landing?.scienceFeatures as any[])?.map((f: any) => ({
    icon: f.icon,
    title: f.title,
    description: f.description,
  }))

  const processSteps = (landing?.processSteps as any[])?.map((s: any) => ({
    title: s.title,
    description: s.description,
  }))

  const testimonials = (landing?.testimonials as any[])?.map((t: any) => ({
    text: t.text,
    name: t.name,
    role: t.role || undefined,
    avatarUrl: getMediaUrl(t.avatar),
    rating: t.rating || 5,
  }))

  const socialLinks = (landing?.socialLinks as any[])?.map((s: any) => ({
    platform: s.platform,
    url: s.url,
  }))

  return (
    <ThemeProvider>
      <PageWrapper>
        <ParticleField />
        <Header />
        <main style={{ position: 'relative', zIndex: 1 }}>
          <Hero
            title={landing?.heroTitle as string}
            subtitle={landing?.heroSubtitle as string}
            ctaText={landing?.heroCta as string}
            ctaLink={landing?.heroCtaLink as string}
            secondaryCtaText={landing?.heroSecondaryCtaText as string}
            secondaryCtaLink={landing?.heroSecondaryCtaLink as string}
            bgImageUrl={heroBgUrl}
          />
          <BenefitsSection
            stats={landing?.stats as any[]}
          />
          <ScienceSection
            label={landing?.scienceLabel as string}
            title={landing?.scienceTitle as string}
            desc={landing?.scienceDesc as string}
            features={scienceFeatures}
            imageUrl={scienceImageUrl}
          />
          <FlavorsSection
            label={landing?.catalogLabel as string}
            title={landing?.catalogTitle as string}
            desc={landing?.catalogDesc as string}
            products={products}
          />
          <ProcessSection
            label={landing?.processLabel as string}
            title={landing?.processTitle as string}
            desc={landing?.processDesc as string}
            steps={processSteps}
          />
          <TestimonialsSection
            label={landing?.testimonialsLabel as string}
            title={landing?.testimonialsTitle as string}
            testimonials={testimonials}
          />
          <JoinSection
            title={landing?.joinTitle as string}
            desc={landing?.joinDesc as string}
            buttonText={landing?.joinButtonText as string}
          />
        </main>
        <Footer
          desc={landing?.footerDesc as string}
          socialLinks={socialLinks}
        />
      </PageWrapper>
    </ThemeProvider>
  )
}
