import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(request: Request) {
  try {
    const payload = await getPayload({ config })
    const { searchParams } = new URL(request.url)

    const category = searchParams.get('category')
    const tag = searchParams.get('tag')
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const page = parseInt(searchParams.get('page') || '1', 10)

    const where: any = {
      status: { equals: 'published' },
    }

    if (category) {
      where.category = { equals: category }
    }

    const result = await payload.find({
      collection: 'posts',
      where,
      sort: '-publishedAt',
      limit,
      page,
      depth: 1,
    })

    // Filter by tag if provided (tags is an array)
    let articles = result.docs
    if (tag) {
      articles = articles.filter((a: any) =>
        a.tags?.some((t: any) => t.tag?.toLowerCase() === tag.toLowerCase())
      )
    }

    const formatted = articles.map((article: any) => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      category: article.category,
      author: article.author,
      publishedAt: article.publishedAt,
      coverImage: article.coverImage?.url || null,
      tags: article.tags?.map((t: any) => t.tag) || [],
    }))

    return NextResponse.json({
      articles: formatted,
      totalDocs: result.totalDocs,
      totalPages: result.totalPages,
      page: result.page,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    })
  } catch (error) {
    console.error('[api/articles] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 })
  }
}
