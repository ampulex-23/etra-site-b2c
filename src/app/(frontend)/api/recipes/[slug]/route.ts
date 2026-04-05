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
      collection: 'recipes',
      where: {
        slug: { equals: slug },
        status: { equals: 'published' },
      },
      limit: 1,
      depth: 2,
    })

    if (result.docs.length === 0) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
    }

    const recipe = result.docs[0] as any

    // Format related products
    const relatedProducts = (recipe.relatedProducts || [])
      .filter((p: any) => typeof p === 'object')
      .map((p: any) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        price: p.price,
        image: p.images?.[0]?.url || null,
      }))

    // Fetch related recipes (same difficulty or similar tags)
    let relatedRecipes: any[] = []
    const related = await payload.find({
      collection: 'recipes',
      where: {
        status: { equals: 'published' },
        id: { not_equals: recipe.id },
      },
      limit: 4,
      sort: '-publishedAt',
      depth: 1,
    })
    relatedRecipes = related.docs.map((r: any) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      excerpt: r.excerpt,
      difficulty: r.difficulty,
      prepTime: r.prepTime,
      coverImage: r.coverImage?.url || null,
    }))

    return NextResponse.json({
      recipe: {
        id: recipe.id,
        title: recipe.title,
        slug: recipe.slug,
        excerpt: recipe.excerpt,
        content: recipe.content,
        difficulty: recipe.difficulty,
        prepTime: recipe.prepTime,
        fermentationTime: recipe.fermentationTime,
        servings: recipe.servings,
        publishedAt: recipe.publishedAt,
        coverImage: recipe.coverImage?.url || null,
        tags: recipe.tags?.map((t: any) => t.tag) || [],
        ingredients: recipe.ingredients || [],
        steps: recipe.steps?.map((s: any) => ({
          step: s.step,
          image: s.image?.url || null,
          tip: s.tip,
        })) || [],
        seo: recipe.seo || null,
      },
      relatedProducts,
      relatedRecipes,
    })
  } catch (error) {
    console.error('[api/recipes/[slug]] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch recipe' }, { status: 500 })
  }
}
