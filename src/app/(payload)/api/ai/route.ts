import { NextRequest, NextResponse } from 'next/server'

const POLZA_API_URL = 'https://api.polza.ai/v1/chat/completions'
const POLZA_API_KEY = process.env.POLZA_API_KEY || ''

export async function POST(req: NextRequest) {
  try {
    const { prompt, content, mode } = await req.json()

    if (!POLZA_API_KEY) {
      return NextResponse.json({ error: 'POLZA_API_KEY not configured' }, { status: 500 })
    }

    let systemMessage = ''
    let userMessage = ''

    switch (mode) {
      case 'generate':
        systemMessage =
          'Ты — копирайтер бренда ЭТРА (ферментированные напитки с пробиотиками). ' +
          'Пиши красивые, информативные тексты на русском языке. ' +
          'Форматируй ответ в Markdown: используй ## и ### для заголовков, **жирный**, *курсив*, ' +
          'маркированные списки (- ), нумерованные списки (1. ). ' +
          'Отвечай только текстом без вводных фраз.'
        userMessage = prompt
        break

      case 'rewrite':
        systemMessage =
          'Ты — редактор бренда ЭТРА. Перепиши текст согласно инструкции. ' +
          'Сохрани смысл, но улучши стиль и подачу. ' +
          'Форматируй в Markdown: заголовки (## ###), **жирный**, *курсив*, списки. ' +
          'Отвечай только переписанным текстом без вводных фраз.'
        userMessage = `Инструкция: ${prompt}\n\nИсходный текст:\n${content}`
        break

      case 'improve':
        systemMessage =
          'Ты — редактор бренда ЭТРА. Улучши данный текст: ' +
          'исправь ошибки, улучши стиль, сделай более привлекательным. ' +
          'Форматируй в Markdown: заголовки (## ###), **жирный**, *курсив*, списки. ' +
          'Отвечай только улучшенным текстом без вводных фраз.'
        userMessage = content
        break

      case 'shorten':
        systemMessage =
          'Ты — редактор. Сократи текст, сохранив ключевые мысли. ' +
          'Форматируй в Markdown: заголовки, **жирный**, *курсив*, списки. ' +
          'Отвечай только сокращённым текстом.'
        userMessage = content
        break

      case 'expand':
        systemMessage =
          'Ты — копирайтер бренда ЭТРА. Расширь и дополни текст, ' +
          'добавь деталей и глубины. ' +
          'Форматируй в Markdown: заголовки (## ###), **жирный**, *курсив*, списки. ' +
          'Отвечай только расширенным текстом.'
        userMessage = content
        break

      default:
        systemMessage =
          'Ты — ассистент бренда ЭТРА. Помогай с текстом на русском. ' +
          'Отвечай только результатом без вводных фраз.'
        userMessage = prompt ? `${prompt}\n\n${content || ''}` : content || ''
    }

    const response = await fetch(POLZA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${POLZA_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-4.1-mini',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Polza API error:', response.status, errText)
      return NextResponse.json(
        { error: `AI API error: ${response.status}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content || ''

    return NextResponse.json({ text })
  } catch (error: unknown) {
    console.error('AI route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
