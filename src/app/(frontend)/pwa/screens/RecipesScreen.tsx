'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface RecipeCard {
  id: string
  title: string
  slug: string
  excerpt: string | null
  difficulty: string
  prepTime: number | null
  fermentationTime: string | null
  coverImage: string | null
  tags: string[]
}

const difficultyLabels: Record<string, { label: string; emoji: string }> = {
  easy: { label: 'Просто', emoji: '🟢' },
  medium: { label: 'Средне', emoji: '🟡' },
  hard: { label: 'Сложно', emoji: '🔴' },
}

export function RecipesScreen() {
  const [recipes, setRecipes] = useState<RecipeCard[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string | null>(null)

  useEffect(() => {
    fetchRecipes()
  }, [filter])

  const fetchRecipes = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter) params.set('difficulty', filter)
      const res = await fetch(`/api/recipes?${params}`)
      if (res.ok) {
        const data = await res.json()
        setRecipes(data.recipes || [])
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pwa-screen animate-in">
      {/* Header */}
      <div className="recipes-header">
        <h1 className="recipes-header__title">🍶 Рецепты</h1>
        <p className="recipes-header__desc">
          Авторские рецепты ферментированных напитков и блюд
        </p>
      </div>

      {/* Filter */}
      <div className="recipes-filter">
        <div className="pill-toggle">
          <button
            className={`pill-toggle__item ${filter === null ? 'pill-toggle__item--active' : ''}`}
            onClick={() => setFilter(null)}
          >
            Все
          </button>
          <button
            className={`pill-toggle__item ${filter === 'easy' ? 'pill-toggle__item--active' : ''}`}
            onClick={() => setFilter('easy')}
          >
            🟢 Просто
          </button>
          <button
            className={`pill-toggle__item ${filter === 'medium' ? 'pill-toggle__item--active' : ''}`}
            onClick={() => setFilter('medium')}
          >
            🟡 Средне
          </button>
          <button
            className={`pill-toggle__item ${filter === 'hard' ? 'pill-toggle__item--active' : ''}`}
            onClick={() => setFilter('hard')}
          >
            🔴 Сложно
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div className="spinner" />
        </div>
      ) : recipes.length === 0 ? (
        <div className="recipes-empty glass">
          <div style={{ fontSize: 48, marginBottom: 12 }}>🧪</div>
          <div className="t-h3" style={{ marginBottom: 8 }}>Рецепты скоро появятся</div>
          <p className="t-caption t-sec">
            Мы работаем над коллекцией авторских рецептов от шеф-поваров и нутрициологов.
          </p>
        </div>
      ) : (
        <div className="recipes-grid">
          {recipes.map((recipe) => {
            const diff = difficultyLabels[recipe.difficulty] || difficultyLabels.easy
            return (
              <Link key={recipe.id} href={`/recipes/${recipe.slug}`} className="recipe-card glass">
                <div className="recipe-card__cover">
                  {recipe.coverImage ? (
                    <Image
                      src={recipe.coverImage}
                      alt={recipe.title}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="recipe-card__cover-placeholder">🍶</div>
                  )}
                  <div className="recipe-card__difficulty-badge">
                    {diff.emoji} {diff.label}
                  </div>
                </div>
                <div className="recipe-card__body">
                  <div className="recipe-card__title">{recipe.title}</div>
                  {recipe.excerpt && (
                    <div className="recipe-card__excerpt">{recipe.excerpt}</div>
                  )}
                  <div className="recipe-card__meta">
                    {recipe.prepTime && (
                      <span>⏱ {recipe.prepTime} мин</span>
                    )}
                    {recipe.fermentationTime && (
                      <span>🕐 {recipe.fermentationTime}</span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
