'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { RichText } from '../../components/RichText'

interface Ingredient {
  name: string
  amount: string | null
  optional: boolean
}

interface Step {
  step: any
  image: string | null
  tip: string | null
}

interface Recipe {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: any
  difficulty: string
  prepTime: number | null
  fermentationTime: string | null
  servings: number | null
  publishedAt: string | null
  coverImage: string | null
  tags: string[]
  ingredients: Ingredient[]
  steps: Step[]
}

interface RelatedProduct {
  id: string
  title: string
  slug: string
  price: number
  image: string | null
}

interface RelatedRecipe {
  id: string
  title: string
  slug: string
  excerpt: string | null
  difficulty: string
  prepTime: number | null
  coverImage: string | null
}

const difficultyLabels: Record<string, { label: string; emoji: string }> = {
  easy: { label: 'Просто', emoji: '🟢' },
  medium: { label: 'Средне', emoji: '🟡' },
  hard: { label: 'Сложно', emoji: '🔴' },
}

export function RecipeScreen() {
  const params = useParams()
  const router = useRouter()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([])
  const [relatedRecipes, setRelatedRecipes] = useState<RelatedRecipe[]>([])
  const [loading, setLoading] = useState(true)
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (params.slug) fetchRecipe(params.slug as string)
  }, [params.slug])

  const fetchRecipe = async (slug: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/recipes/${slug}`)
      if (!res.ok) {
        router.replace('/recipes')
        return
      }
      const data = await res.json()
      setRecipe(data.recipe)
      setRelatedProducts(data.relatedProducts || [])
      setRelatedRecipes(data.relatedRecipes || [])
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleIngredient = (index: number) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  if (loading) {
    return (
      <div className="pwa-screen animate-in" style={{ textAlign: 'center', padding: 60 }}>
        <div className="spinner" />
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="pwa-screen animate-in" style={{ textAlign: 'center', padding: 40 }}>
        <p className="t-body t-sec">Рецепт не найден</p>
        <Link href="/recipes" className="btn btn--secondary" style={{ marginTop: 16 }}>
          К рецептам
        </Link>
      </div>
    )
  }

  const diff = difficultyLabels[recipe.difficulty] || difficultyLabels.easy

  return (
    <div className="pwa-screen animate-in recipe-screen">
      {/* Cover */}
      <div className="recipe-cover">
        {recipe.coverImage ? (
          <Image
            src={recipe.coverImage}
            alt={recipe.title}
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
        ) : (
          <div className="recipe-cover__placeholder">🍶</div>
        )}
        <div className="recipe-cover__overlay" />
      </div>

      {/* Header */}
      <div className="recipe-header">
        <h1 className="recipe-header__title">{recipe.title}</h1>
        <div className="recipe-header__meta">
          <span className="recipe-meta-item">
            {diff.emoji} {diff.label}
          </span>
          {recipe.prepTime && (
            <span className="recipe-meta-item">⏱ {recipe.prepTime} мин</span>
          )}
          {recipe.fermentationTime && (
            <span className="recipe-meta-item">🕐 {recipe.fermentationTime}</span>
          )}
          {recipe.servings && (
            <span className="recipe-meta-item">🍽 {recipe.servings} порций</span>
          )}
        </div>
        {recipe.excerpt && (
          <p className="recipe-header__excerpt">{recipe.excerpt}</p>
        )}
      </div>

      {/* Ingredients */}
      {recipe.ingredients.length > 0 && (
        <div className="recipe-section">
          <h2 className="recipe-section__title">🧂 Ингредиенты</h2>
          <div className="recipe-ingredients glass">
            {recipe.ingredients.map((ing, i) => (
              <button
                key={i}
                className={`recipe-ingredient ${checkedIngredients.has(i) ? 'recipe-ingredient--checked' : ''}`}
                onClick={() => toggleIngredient(i)}
              >
                <span className="recipe-ingredient__check">
                  {checkedIngredients.has(i) ? '✓' : '○'}
                </span>
                <span className="recipe-ingredient__name">
                  {ing.name}
                  {ing.optional && <span className="recipe-ingredient__optional"> (опционально)</span>}
                </span>
                {ing.amount && (
                  <span className="recipe-ingredient__amount">{ing.amount}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Steps */}
      {recipe.steps.length > 0 && (
        <div className="recipe-section">
          <h2 className="recipe-section__title">📝 Приготовление</h2>
          <div className="recipe-steps">
            {recipe.steps.map((step, i) => (
              <div key={i} className="recipe-step glass">
                <div className="recipe-step__number">{i + 1}</div>
                <div className="recipe-step__content">
                  {step.image && (
                    <div className="recipe-step__image">
                      <Image
                        src={step.image}
                        alt={`Шаг ${i + 1}`}
                        width={300}
                        height={200}
                        style={{ objectFit: 'cover', borderRadius: 8 }}
                      />
                    </div>
                  )}
                  <div className="rich-text">
                    <RichText content={step.step} />
                  </div>
                  {step.tip && (
                    <div className="recipe-step__tip">
                      💡 {step.tip}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional content */}
      {recipe.content && (
        <div className="recipe-section">
          <h2 className="recipe-section__title">📖 Дополнительно</h2>
          <div className="recipe-content glass">
            <div className="rich-text">
              <RichText content={recipe.content} />
            </div>
          </div>
        </div>
      )}

      {/* Tags */}
      {recipe.tags.length > 0 && (
        <div className="recipe-tags">
          {recipe.tags.map((tag, i) => (
            <span key={i} className="recipe-tag">#{tag}</span>
          ))}
        </div>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="recipe-section">
          <h2 className="recipe-section__title">🛒 Продукты для рецепта</h2>
          <div className="recipe-products">
            {relatedProducts.map((p) => (
              <Link key={p.id} href={`/products/${p.slug}`} className="recipe-product-card glass">
                {p.image && (
                  <div className="recipe-product-card__image">
                    <Image src={p.image} alt={p.title} width={60} height={60} style={{ objectFit: 'cover', borderRadius: 8 }} />
                  </div>
                )}
                <div className="recipe-product-card__info">
                  <div className="recipe-product-card__title">{p.title}</div>
                  <div className="recipe-product-card__price">{p.price?.toLocaleString('ru-RU')} ₽</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Related Recipes */}
      {relatedRecipes.length > 0 && (
        <div className="recipe-section">
          <h2 className="recipe-section__title">🍳 Другие рецепты</h2>
          <div className="recipe-related-grid">
            {relatedRecipes.slice(0, 3).map((r) => (
              <Link key={r.id} href={`/recipes/${r.slug}`} className="recipe-related-card glass">
                {r.coverImage && (
                  <div className="recipe-related-card__cover">
                    <Image src={r.coverImage} alt={r.title} fill style={{ objectFit: 'cover' }} />
                  </div>
                )}
                <div className="recipe-related-card__body">
                  <div className="recipe-related-card__title">{r.title}</div>
                  <div className="recipe-related-card__meta">
                    {difficultyLabels[r.difficulty]?.emoji} {r.prepTime && `${r.prepTime} мин`}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Back link */}
      <div style={{ padding: '24px 16px', textAlign: 'center' }}>
        <Link href="/recipes" className="btn btn--secondary">
          ← Все рецепты
        </Link>
      </div>
    </div>
  )
}
