import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(request: Request) {
  try {
    const payload = await getPayload({ config })
    const { searchParams } = new URL(request.url)

    const difficulty = searchParams.get('difficulty')
    const tag = searchParams.get('tag')
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const page = parseInt(searchParams.get('page') || '1', 10)

    const where: any = {
      status: { equals: 'published' },
    }

    if (difficulty) {
      where.difficulty = { equals: difficulty }
    }

    const result = await payload.find({
      collection: 'recipes',
      where,
      sort: '-publishedAt',
      limit,
      page,
      depth: 1,
    })

    // Filter by tag if provided
    let recipes = result.docs
    if (tag) {
      recipes = recipes.filter((r: any) =>
        r.tags?.some((t: any) => t.tag?.toLowerCase() === tag.toLowerCase())
      )
    }

    const formatted = recipes.map((recipe: any) => ({
      id: recipe.id,
      title: recipe.title,
      slug: recipe.slug,
      excerpt: recipe.excerpt,
      difficulty: recipe.difficulty,
      prepTime: recipe.prepTime,
      fermentationTime: recipe.fermentationTime,
      servings: recipe.servings,
      publishedAt: recipe.publishedAt,
      coverImage: recipe.coverImage?.url || null,
      tags: recipe.tags?.map((t: any) => t.tag) || [],
      ingredientCount: recipe.ingredients?.length || 0,
    }))

    return NextResponse.json({
      recipes: formatted,
      totalDocs: result.totalDocs,
      totalPages: result.totalPages,
      page: result.page,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    })
  } catch (error) {
    console.error('[api/recipes] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 })
  }
}
