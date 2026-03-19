import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config })

    const authHeader = req.headers.get('cookie')
    const user = await payload
      .find({
        collection: 'users',
        limit: 1,
        where: { id: { exists: true } },
      })
      .catch(() => null)

    const body = await req.json()
    const { userId, email, name, role } = body

    if (!userId && !email) {
      return NextResponse.json({ error: 'userId or email required' }, { status: 400 })
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    let targetUserId = userId

    if (!targetUserId && email) {
      // Check if user with this email already exists
      const existing = await payload.find({
        collection: 'users',
        where: { email: { equals: email } },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        targetUserId = existing.docs[0].id
      } else {
        // Create a new user with a random temporary password
        const tempPassword = crypto.randomBytes(16).toString('hex')
        const newUser = await payload.create({
          collection: 'users',
          data: {
            email,
            password: tempPassword,
            name: name || '',
            role: role || 'manager',
            active: true,
            inviteToken: token,
            inviteExpires: expires.toISOString(),
          } as any,
        })
        targetUserId = newUser.id
      }
    }

    // Update invite token
    await payload.update({
      collection: 'users',
      id: targetUserId,
      data: {
        inviteToken: token,
        inviteExpires: expires.toISOString(),
      } as any,
    })

    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || req.nextUrl.origin
    const inviteUrl = `${baseUrl}/admin/invite/${token}`

    return NextResponse.json({
      success: true,
      inviteUrl,
      token,
      expiresAt: expires.toISOString(),
    })
  } catch (err: any) {
    console.error('[invite] Error:', err)
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}
