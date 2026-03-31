import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import crypto from 'crypto'

interface TelegramAuthData {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

function verifyTelegramAuth(data: TelegramAuthData, botToken: string): boolean {
  const { hash, ...rest } = data
  const checkString = Object.keys(rest)
    .sort()
    .map((key) => `${key}=${rest[key as keyof typeof rest]}`)
    .join('\n')

  const secretKey = crypto.createHash('sha256').update(botToken).digest()
  const hmac = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex')

  if (hmac !== hash) return false

  // Check auth_date is not older than 24 hours
  const now = Math.floor(Date.now() / 1000)
  if (now - data.auth_date > 86400) return false

  return true
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as TelegramAuthData
    console.log('[Telegram API] Received auth request:', body)
    const payload = await getPayload({ config })

    // Get bot token from settings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const settings = await (payload.findGlobal as any)({ slug: 'shop-settings' }) as Record<string, unknown>
    const botToken = settings.telegramBotToken as string | undefined

    if (!botToken) {
      console.error('[Telegram API] Bot token not configured')
      return NextResponse.json(
        { error: 'Telegram авторизация не настроена' },
        { status: 500 },
      )
    }

    // Verify Telegram data
    const isValid = verifyTelegramAuth(body, botToken)
    console.log('[Telegram API] Verification result:', isValid)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Неверные данные авторизации Telegram' },
        { status: 401 },
      )
    }

    const telegramId = String(body.id)
    const telegramName = [body.first_name, body.last_name].filter(Boolean).join(' ')

    // Find existing customer by telegram.chatId
    const existing = await payload.find({
      collection: 'customers',
      where: { 'telegram.chatId': { equals: telegramId } },
      limit: 1,
    })

    let customer: Record<string, unknown>

    if (existing.docs.length > 0) {
      customer = existing.docs[0] as unknown as Record<string, unknown>
      // Update telegram profile data
      await payload.update({
        collection: 'customers',
        id: customer.id as string,
        data: {
          telegram: {
            chatId: telegramId,
            username: body.username || '',
            firstName: body.first_name || '',
            lastName: body.last_name || '',
            photoUrl: body.photo_url || '',
          },
        } as any,
      })
    } else {
      // Create new customer
      const tempEmail = `tg_${telegramId}@telegram.user`
      const tempPassword = crypto.randomBytes(32).toString('hex')

      customer = await payload.create({
        collection: 'customers',
        data: {
          email: tempEmail,
          password: tempPassword,
          name: telegramName,
          source: 'site',
          telegram: {
            chatId: telegramId,
            username: body.username || '',
            firstName: body.first_name || '',
            lastName: body.last_name || '',
            photoUrl: body.photo_url || '',
          },
        } as any,
      }) as unknown as Record<string, unknown>
    }

    // Generate JWT token for this customer
    const loginResult = await payload.login({
      collection: 'customers',
      data: {
        email: customer.email as string,
        password: '', // We'll use a direct token approach
      },
    }).catch(() => null)

    if (!loginResult) {
      // Generate a simple JWT using Node.js crypto
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
      const now = Math.floor(Date.now() / 1000)
      const payloadData = Buffer.from(
        JSON.stringify({
          id: customer.id,
          email: customer.email,
          collection: 'customers',
          iat: now,
          exp: now + 30 * 24 * 60 * 60,
        }),
      ).toString('base64url')
      const signature = crypto
        .createHmac('sha256', process.env.PAYLOAD_SECRET || '')
        .update(`${header}.${payloadData}`)
        .digest('base64url')
      const token = `${header}.${payloadData}.${signature}`

      return NextResponse.json({
        token,
        user: {
          id: customer.id,
          email: customer.email,
          name: customer.name || telegramName,
          telegramId,
        },
      })
    }

    const response = {
      token: loginResult.token,
      user: {
        id: (loginResult.user as unknown as Record<string, unknown>).id,
        email: (loginResult.user as unknown as Record<string, unknown>).email,
        name: (loginResult.user as unknown as Record<string, unknown>).name || telegramName,
        telegramId,
      },
    }
    console.log('[Telegram API] Sending success response:', response)
    return NextResponse.json(response)
  } catch (err) {
    console.error('[Telegram API] Error:', err)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 },
    )
  }
}
