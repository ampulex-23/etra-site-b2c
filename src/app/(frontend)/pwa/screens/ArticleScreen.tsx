'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { RichText } from '../../components/RichText'

interface Article {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: any
  category: string | null
  author: string | null
  publishedAt: string | null
  coverImage: string | null
  tags: string[]
}

interface RelatedArticle {
  id: string
  title: string
  slug: string
  excerpt: string | null
  coverImage: string | null
}

export function ArticleScreen() {
  const params = useParams()
  const router = useRouter()
  const [article, setArticle] = useState<Article | null>(null)
  const [relatedArticles, setRelatedArticles] = useState<RelatedArticle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.slug) fetchArticle(params.slug as string)
  }, [params.slug])

  const fetchArticle = async (slug: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/articles/${slug}`)
      if (!res.ok) {
        router.replace('/articles')
        return
      }
      const data = await res.json()
      setArticle(data.article)
      setRelatedArticles(data.relatedArticles || [])
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="pwa-screen animate-in" style={{ textAlign: 'center', padding: 60 }}>
        <div className="spinner" />
      </div>
    )
  }

  if (!article) {
    return (
      <div className="pwa-screen animate-in" style={{ textAlign: 'center', padding: 40 }}>
        <p className="t-body t-sec">Статья не найдена</p>
        <Link href="/" className="btn btn--secondary" style={{ marginTop: 16 }}>
          На главную
        </Link>
      </div>
    )
  }

  return (
    <div className="pwa-screen animate-in article-screen">
      {/* Cover */}
      {article.coverImage && (
        <div className="article-cover">
          <Image
            src={article.coverImage}
            alt={article.title}
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
          <div className="article-cover__overlay" />
        </div>
      )}

      {/* Header */}
      <div className="article-header">
        {article.category && (
          <div className="article-header__category">{article.category}</div>
        )}
        <h1 className="article-header__title">{article.title}</h1>
        <div className="article-header__meta">
          {article.author && <span>✍️ {article.author}</span>}
          {article.publishedAt && <span>📅 {formatDate(article.publishedAt)}</span>}
        </div>
        {article.excerpt && (
          <p className="article-header__excerpt">{article.excerpt}</p>
        )}
      </div>

      {/* Content */}
      <div className="article-content">
        <div className="rich-text">
          <RichText content={article.content} />
        </div>
      </div>

      {/* Tags */}
      {article.tags.length > 0 && (
        <div className="article-tags">
          {article.tags.map((tag, i) => (
            <span key={i} className="article-tag">#{tag}</span>
          ))}
        </div>
      )}

      {/* Related */}
      {relatedArticles.length > 0 && (
        <div className="article-related">
          <h2 className="article-related__title">Похожие статьи</h2>
          <div className="article-related__grid">
            {relatedArticles.map((a) => (
              <Link key={a.id} href={`/articles/${a.slug}`} className="article-related-card glass">
                {a.coverImage && (
                  <div className="article-related-card__cover">
                    <Image src={a.coverImage} alt={a.title} fill style={{ objectFit: 'cover' }} />
                  </div>
                )}
                <div className="article-related-card__body">
                  <div className="article-related-card__title">{a.title}</div>
                  {a.excerpt && (
                    <div className="article-related-card__excerpt">{a.excerpt}</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Back link */}
      <div style={{ padding: '24px 16px', textAlign: 'center' }}>
        <Link href="/" className="btn btn--secondary">
          ← На главную
        </Link>
      </div>
    </div>
  )
}
