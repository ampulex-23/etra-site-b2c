import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(req: NextRequest) {
  try {
    const { prompt, action, imageUrl } = await req.json()

    const payload = await getPayload({ config })
    const settings = await (payload as any).findGlobal({ slug: 'ai-settings' }).catch(() => null)

    const apiUrl = (settings as any)?.aiApiUrl || process.env.POLZA_API_URL || 'https://api.polza.ai/v1/chat/completions'
    const apiKey = (settings as any)?.aiApiKey || process.env.POLZA_API_KEY || ''
    const imageModel = (settings as any)?.aiImageModel || 'openai/dall-e-3'
    const textModel = (settings as any)?.aiTextModel || 'openai/gpt-4.1-mini'

    if (!apiKey) {
      return NextResponse.json({ error: 'API ключ не настроен. Перейдите в Настройки → ИИ Агент.' }, { status: 500 })
    }

    // Action: generate_alt — generate alt text from image URL using vision model
    if (action === 'generate_alt') {
      if (!imageUrl) {
        return NextResponse.json({ error: 'URL изображения не указан' }, { status: 400 })
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: textModel,
          messages: [
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
          ],
          max_tokens: 150,
          temperature: 0.3,
        }),
      })

      if (!response.ok) {
        const errText = await response.text()
        console.error('AI image alt error:', response.status, errText)
        return NextResponse.json({ error: `AI API error: ${response.status}` }, { status: response.status })
      }

      const data = await response.json()
      const alt = data.choices?.[0]?.message?.content?.trim() || ''
      return NextResponse.json({ alt })
    }

    // Action: generate_caption — generate caption/description from image
    if (action === 'generate_caption') {
      if (!imageUrl) {
        return NextResponse.json({ error: 'URL изображения не указан' }, { status: 400 })
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: textModel,
          messages: [
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
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        const errText = await response.text()
        console.error('AI image caption error:', response.status, errText)
        return NextResponse.json({ error: `AI API error: ${response.status}` }, { status: response.status })
      }

      const data = await response.json()
      const caption = data.choices?.[0]?.message?.content?.trim() || ''
      return NextResponse.json({ caption })
    }

    // Action: generate_image — generate image from prompt
    if (action === 'generate_image') {
      if (!prompt) {
        return NextResponse.json({ error: 'Промт не указан' }, { status: 400 })
      }

      // For OpenRouter/Polza compatible API with image generation models
      const isOpenAIDallE = imageModel.includes('dall-e')

      if (isOpenAIDallE) {
        // Use OpenAI DALL-E format through the proxy
        const baseUrl = apiUrl.replace('/chat/completions', '/images/generations')
        const response = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: imageModel.replace('openai/', ''),
            prompt: prompt,
            n: 1,
            size: '1024x1024',
            response_format: 'url',
          }),
        })

        if (!response.ok) {
          const errText = await response.text()
          console.error('AI image gen error:', response.status, errText)
          return NextResponse.json({ error: `Ошибка генерации: ${response.status}` }, { status: response.status })
        }

        const data = await response.json()
        const generatedUrl = data.data?.[0]?.url || data.data?.[0]?.b64_json || ''
        return NextResponse.json({ imageUrl: generatedUrl })
      }

      // For other models, use chat completion with image generation capability
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: imageModel,
          messages: [
            {
              role: 'user',
              content: `Generate an image: ${prompt}`,
            },
          ],
          max_tokens: 4096,
        }),
      })

      if (!response.ok) {
        const errText = await response.text()
        console.error('AI image gen error:', response.status, errText)
        return NextResponse.json({ error: `Ошибка генерации: ${response.status}` }, { status: response.status })
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content || ''
      // Try to extract image URL from response
      const urlMatch = content.match(/https?:\/\/[^\s"'<>]+\.(png|jpg|jpeg|webp|gif)[^\s"'<>]*/i)
      const generatedUrl = urlMatch?.[0] || ''

      return NextResponse.json({ imageUrl: generatedUrl, rawResponse: content })
    }

    // Action: describe_image — detailed description for product/content use
    if (action === 'describe_image') {
      if (!imageUrl) {
        return NextResponse.json({ error: 'URL изображения не указан' }, { status: 400 })
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: textModel,
          messages: [
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
          ],
          max_tokens: 500,
          temperature: 0.5,
        }),
      })

      if (!response.ok) {
        const errText = await response.text()
        console.error('AI image describe error:', response.status, errText)
        return NextResponse.json({ error: `AI API error: ${response.status}` }, { status: response.status })
      }

      const data = await response.json()
      const description = data.choices?.[0]?.message?.content?.trim() || ''
      return NextResponse.json({ description })
    }

    return NextResponse.json({ error: 'Неизвестное действие' }, { status: 400 })
  } catch (error: unknown) {
    console.error('AI image route error:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
