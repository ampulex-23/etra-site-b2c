import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const payload = await getPayload({ config })
  const { searchParams } = new URL(req.url)

  const contentType = searchParams.get('contentType')
  const postId = searchParams.get('post')
  const recipeId = searchParams.get('recipe')
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '20', 10)

  const where: Record<string, unknown> = {
    status: { equals: 'approved' },
    parent: { exists: false },
  }

  if (contentType) {
    where.contentType = { equals: contentType }
  }
  if (postId) {
    where.post = { equals: postId }
    where.contentType = { equals: 'post' }
  }
  if (recipeId) {
    where.recipe = { equals: recipeId }
    where.contentType = { equals: 'recipe' }
  }

  const result = await payload.find({
    collection: 'comments',
    where,
    sort: '-createdAt',
    limit,
    page,
    depth: 1,
  })

  // For each top-level comment, fetch replies
  const comments = await Promise.all(
    result.docs.map(async (doc) => {
      const replies = await payload.find({
        collection: 'comments',
        where: {
          parent: { equals: doc.id },
          status: { equals: 'approved' },
        },
        sort: 'createdAt',
        limit: 50,
        depth: 1,
      })

      const author = doc.author as Record<string, unknown> | undefined
      return {
        id: doc.id,
        text: doc.text,
        authorName: author?.displayName || 'Аноним',
        isStaff: Boolean(author?.user),
        likes: doc.likes,
        createdAt: doc.createdAt,
        replies: replies.docs.map((r) => {
          const rAuthor = r.author as Record<string, unknown> | undefined
          return {
            id: r.id,
            text: r.text,
            authorName: rAuthor?.displayName || 'Аноним',
            isStaff: Boolean(rAuthor?.user),
            likes: r.likes,
            createdAt: r.createdAt,
          }
        }),
      }
    }),
  )

  return NextResponse.json({
    docs: comments,
    totalDocs: result.totalDocs,
    totalPages: result.totalPages,
    page: result.page,
  })
}

export async function POST(req: NextRequest) {
  const payload = await getPayload({ config })

  const token = req.cookies.get('payload-token')?.value
  if (!token) {
    return NextResponse.json({ error: 'Необходимо авторизоваться' }, { status: 401 })
  }

  // Try customer auth first, then admin user auth
  let authorData: Record<string, unknown> = {}

  try {
    const meRes = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || ''}/api/customers/me`, {
      headers: { Authorization: `JWT ${token}` },
    })
    if (meRes.ok) {
      const meData = await meRes.json()
      if (meData.user) {
        authorData = { customer: meData.user.id }
      }
    }
  } catch {
    // ignore
  }

  if (!authorData.customer) {
    try {
      const meRes = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || ''}/api/users/me`, {
        headers: { Authorization: `JWT ${token}` },
      })
      if (meRes.ok) {
        const meData = await meRes.json()
        if (meData.user) {
          authorData = { user: meData.user.id }
        }
      }
    } catch {
      // ignore
    }
  }

  if (!authorData.customer && !authorData.user) {
    return NextResponse.json({ error: 'Необходимо авторизоваться' }, { status: 401 })
  }

  const body = await req.json()
  const { text, contentType, postId, recipeId, parentId } = body

  if (!text) {
    return NextResponse.json({ error: 'Текст комментария обязателен' }, { status: 400 })
  }

  if (!contentType || !['post', 'recipe'].includes(contentType)) {
    return NextResponse.json({ error: 'Укажите тип контента (post или recipe)' }, { status: 400 })
  }

  const commentData: Record<string, unknown> = {
    text,
    contentType,
    author: authorData,
    status: 'pending',
  }

  if (contentType === 'post' && postId) {
    commentData.post = postId
  }
  if (contentType === 'recipe' && recipeId) {
    commentData.recipe = recipeId
  }
  if (parentId) {
    commentData.parent = parentId
  }

  const comment = await payload.create({
    collection: 'comments',
    data: commentData as never,
  })

  return NextResponse.json({ id: comment.id, message: 'Комментарий отправлен на модерацию' })
}
