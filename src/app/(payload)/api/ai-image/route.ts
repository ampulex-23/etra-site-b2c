import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

const POLZA_MEDIA_URL = 'https://polza.ai/api/v1/media'
const POLZA_MEDIA_STATUS_URL = 'https://polza.ai/api/v1/media'
const POLZA_CHAT_URL = 'https://polza.ai/api/v1/chat/completions'

async function getSettings() {
  const payload = await getPayload({ config })
  const settings = await (payload as any).findGlobal({ slug: 'ai-settings' }).catch(() => null)
  return {
    chatUrl: (settings as any)?.aiApiUrl || process.env.POLZA_API_URL || POLZA_CHAT_URL,
    apiKey: (settings as any)?.aiApiKey || process.env.POLZA_API_KEY || '',
    imageModel: (settings as any)?.aiImageModel || 'google/gemini-3-pro-image-preview',
    textModel: (settings as any)?.aiTextModel || 'openai/gpt-4.1-mini',
  }
}

async function chatCompletion(
  chatUrl: string,
  apiKey: string,
  model: string,
  messages: unknown[],
  maxTokens: number,
  temperature: number,
) {
  const response = await fetch(chatUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature }),
  })
  if (!response.ok) {
    const errText = await response.text()
    console.error('AI chat error:', response.status, errText)
    throw new Error(`AI API error: ${response.status}`)
  }
  const data = await response.json()
  return data.choices?.[0]?.message?.content?.trim() || ''
}

async function polzaMediaGenerate(
  apiKey: string,
  model: string,
  prompt: string,
  images: { type: string; data: string }[] = [],
) {
  const body: Record<string, unknown> = {
    model,
    input: { prompt, images },
  }

  const response = await fetch(POLZA_MEDIA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errText = await response.text()
    console.error('Polza Media error:', response.status, errText)
    throw new Error(`Media API error: ${response.status}`)
  }

  const data = await response.json()

  // If completed immediately
  if (data.status === 'completed' && data.data) {
    const url = data.data?.[0]?.url || data.data?.url || ''
    return { imageUrl: url, text: data.text || '' }
  }

  // If pending/processing — poll for result
  const taskId = data.id
  if (!taskId) {
    return { imageUrl: '', text: data.text || JSON.stringify(data) }
  }

  // Poll up to 120 seconds
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 2000))
    const statusRes = await fetch(`${POLZA_MEDIA_STATUS_URL}/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!statusRes.ok) continue
    const statusData = await statusRes.json()

    if (statusData.status === 'completed') {
      const url = statusData.data?.[0]?.url || statusData.data?.url || ''
      return { imageUrl: url, text: statusData.text || '' }
    }
    if (statusData.status === 'failed') {
      throw new Error(statusData.error?.message || 'Генерация не удалась')
    }
  }

  throw new Error('Таймаут генерации (120с)')
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, action, imageUrl } = await req.json()
    const { chatUrl, apiKey, imageModel, textModel } = await getSettings()

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API ключ не настроен. Перейдите в Настройки → ИИ Агент.' },
        { status: 500 },
      )
    }

    // ---- TEXT ACTIONS (use chat completions with vision) ----

    if (action === 'generate_alt') {
      if (!imageUrl) return NextResponse.json({ error: 'URL изображения не указан' }, { status: 400 })
      const alt = await chatCompletion(chatUrl, apiKey, textModel, [
        {
          role: 'system',
          content:
            'Ты — SEO-специалист бренда ЭТРА (ферментированные напитки с пробиотиками). ' +
            'Напиши краткий alt-текст для изображения на русском языке. ' +
            'Alt-текст должен быть описательным, до 120 символов, без кавычек. ' +
            'Отвечай ТОЛЬКО alt-текстом, без пояснений.',
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Опиши это изображение для alt-текста:' },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ], 150, 0.3)
      return NextResponse.json({ alt })
    }

    if (action === 'generate_caption') {
      if (!imageUrl) return NextResponse.json({ error: 'URL изображения не указан' }, { status: 400 })
      const caption = await chatCompletion(chatUrl, apiKey, textModel, [
        {
          role: 'system',
          content:
            'Ты — копирайтер бренда ЭТРА (ферментированные напитки с пробиотиками). ' +
            'Напиши красивую подпись к изображению на русском языке. ' +
            'Подпись должна быть привлекательной, до 200 символов, подходящей для каталога или соцсетей. ' +
            'Отвечай ТОЛЬКО подписью, без пояснений.',
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt || 'Напиши подпись к этому изображению:' },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ], 300, 0.7)
      return NextResponse.json({ caption })
    }

    if (action === 'describe_image') {
      if (!imageUrl) return NextResponse.json({ error: 'URL изображения не указан' }, { status: 400 })
      const description = await chatCompletion(chatUrl, apiKey, textModel, [
        {
          role: 'system',
          content:
            'Ты — контент-менеджер бренда ЭТРА. ' +
            'Подробно опиши изображение на русском языке: что изображено, цвета, настроение, ' +
            'подходит ли для продуктовой страницы, соцсетей или баннера. ' +
            'Дай 2-3 предложения. Отвечай без вводных фраз.',
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt || 'Опиши это изображение подробно:' },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ], 500, 0.5)
      return NextResponse.json({ description })
    }

    // ---- IMAGE ACTIONS (use Polza Media API) ----

    if (action === 'generate_image') {
      if (!prompt) return NextResponse.json({ error: 'Промт не указан' }, { status: 400 })
      const result = await polzaMediaGenerate(apiKey, imageModel, prompt)
      return NextResponse.json({ imageUrl: result.imageUrl, text: result.text })
    }

    if (action === 'edit_image') {
      if (!imageUrl) return NextResponse.json({ error: 'URL изображения не указан' }, { status: 400 })
      if (!prompt) return NextResponse.json({ error: 'Укажите что нужно изменить' }, { status: 400 })
      const result = await polzaMediaGenerate(apiKey, imageModel, prompt, [
        { type: 'url', data: imageUrl },
      ])
      return NextResponse.json({ imageUrl: result.imageUrl, text: result.text })
    }

    if (action === 'remove_bg') {
      if (!imageUrl) return NextResponse.json({ error: 'URL изображения не указан' }, { status: 400 })
      const result = await polzaMediaGenerate(
        apiKey,
        imageModel,
        prompt || 'Remove the background completely, keep only the main subject on a transparent/white background',
        [{ type: 'url', data: imageUrl }],
      )
      return NextResponse.json({ imageUrl: result.imageUrl, text: result.text })
    }

    if (action === 'enhance') {
      if (!imageUrl) return NextResponse.json({ error: 'URL изображения не указан' }, { status: 400 })
      const result = await polzaMediaGenerate(
        apiKey,
        imageModel,
        prompt || 'Enhance this product photo: improve lighting, colors, sharpness. Make it look professional for an e-commerce catalog.',
        [{ type: 'url', data: imageUrl }],
      )
      return NextResponse.json({ imageUrl: result.imageUrl, text: result.text })
    }

    return NextResponse.json({ error: 'Неизвестное действие' }, { status: 400 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Внутренняя ошибка сервера'
    console.error('AI image route error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
