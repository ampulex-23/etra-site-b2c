import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params
    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'posts',
      where: {
        slug: { equals: slug },
        status: { equals: 'published' },
      },
      limit: 1,
      depth: 2,
    })

    if (result.docs.length === 0) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    const article = result.docs[0] as any

    // Fetch related articles (same category, excluding current)
    let relatedArticles: any[] = []
    if (article.category) {
      const related = await payload.find({
        collection: 'posts',
        where: {
          status: { equals: 'published' },
          category: { equals: article.category },
          id: { not_equals: article.id },
        },
        limit: 3,
        sort: '-publishedAt',
        depth: 1,
      })
      relatedArticles = related.docs.map((a: any) => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        excerpt: a.excerpt,
        coverImage: a.coverImage?.url || null,
      }))
    }

    return NextResponse.json({
      article: {
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: article.content,
        category: article.category,
        author: article.author,
        publishedAt: article.publishedAt,
        coverImage: article.coverImage?.url || null,
        tags: article.tags?.map((t: any) => t.tag) || [],
        seo: article.seo || null,
      },
      relatedArticles,
    })
  } catch (error) {
    console.error('[api/articles/[slug]] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch article' }, { status: 500 })
  }
}
