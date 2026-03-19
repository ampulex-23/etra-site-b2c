import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'token and password required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'password must be at least 6 characters' }, { status: 400 })
    }

    const users = await payload.find({
      collection: 'users',
      where: {
        inviteToken: { equals: token },
      },
      limit: 1,
    })

    if (users.docs.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired invite link' }, { status: 400 })
    }

    const user = users.docs[0] as any

    if (user.inviteExpires && new Date(user.inviteExpires) < new Date()) {
      return NextResponse.json({ error: 'Invite link has expired' }, { status: 400 })
    }

    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        password,
        inviteToken: '',
        inviteExpires: '',
      } as any,
    })

    return NextResponse.json({
      success: true,
      email: user.email,
      message: 'Password set successfully. You can now log in.',
    })
  } catch (err: any) {
    console.error('[invite/accept] Error:', err)
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}
