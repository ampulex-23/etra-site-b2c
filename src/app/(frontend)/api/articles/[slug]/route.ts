import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

// Helper to populate media in Lexical content nodes
async function populateMediaInContent(content: any, payload: any): Promise<any> {
  if (!content?.root?.children) return content

  const populateNode = async (node: any): Promise<any> => {
    // Handle upload nodes with media IDs
    if (node.type === 'upload' && typeof node.value === 'number') {
      try {
        const media = await payload.findByID({
          collection: 'media',
          id: node.value,
        })
        return { ...node, value: media }
      } catch (err) {
        console.error('Failed to populate media:', node.value, err)
        return node
      }
    }

    // Recursively process children
    if (node.children && Array.isArray(node.children)) {
      const populatedChildren = await Promise.all(
        node.children.map((child: any) => populateNode(child))
      )
      return { ...node, children: populatedChildren }
    }

    return node
  }

  const populatedChildren = await Promise.all(
    content.root.children.map((child: any) => populateNode(child))
  )

  return {
    ...content,
    root: {
      ...content.root,
      children: populatedChildren,
    },
  }
}

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
      depth: 3, // Increased to populate media in content nodes
    })

    if (result.docs.length === 0) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    const article = result.docs[0] as any

    // Populate media in content nodes
    const populatedContent = await populateMediaInContent(article.content, payload)

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
        content: populatedContent, // Use populated content with media
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
