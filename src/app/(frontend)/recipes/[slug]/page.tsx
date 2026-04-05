import { RecipeScreen } from '../../pwa/screens/RecipeScreen'
import { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'recipes',
      where: { slug: { equals: slug }, status: { equals: 'published' } },
      limit: 1,
      depth: 1,
    })
    const recipe = result.docs[0] as any
    if (!recipe) return { title: 'Рецепт не найден — ЭТРА' }

    return {
      title: recipe.seo?.title || `${recipe.title} — Рецепт ЭТРА`,
      description: recipe.seo?.description || recipe.excerpt || '',
      openGraph: {
        title: recipe.seo?.title || recipe.title,
        description: recipe.seo?.description || recipe.excerpt || '',
        images: recipe.seo?.ogImage?.url || recipe.coverImage?.url ? [{ url: recipe.seo?.ogImage?.url || recipe.coverImage?.url }] : [],
      },
    }
  } catch {
    return { title: 'Рецепт — ЭТРА' }
  }
}

export default function RecipePage() {
  return <RecipeScreen />
}
