import { ArticleScreen } from '../../pwa/screens/ArticleScreen'
import { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'posts',
      where: { slug: { equals: slug }, status: { equals: 'published' } },
      limit: 1,
      depth: 1,
    })
    const article = result.docs[0] as any
    if (!article) return { title: 'Статья не найдена — ЭТРА' }

    return {
      title: article.seo?.title || `${article.title} — ЭТРА`,
      description: article.seo?.description || article.excerpt || '',
      openGraph: {
        title: article.seo?.title || article.title,
        description: article.seo?.description || article.excerpt || '',
        images: article.seo?.ogImage?.url || article.coverImage?.url ? [{ url: article.seo?.ogImage?.url || article.coverImage?.url }] : [],
      },
    }
  } catch {
    return { title: 'Статья — ЭТРА' }
  }
}

export default function ArticlePage() {
  return <ArticleScreen />
}
