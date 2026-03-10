import type { GlobalConfig } from 'payload'

export const AISettings: GlobalConfig = {
  slug: 'ai-settings',
  label: 'ИИ Агент',
  admin: {
    group: '⚙️ Настройки',
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'aiApiUrl',
      type: 'text',
      label: 'API URL',
      defaultValue: 'https://api.polza.ai/v1/chat/completions',
      admin: {
        description: 'URL API-эндпоинта (совместимого с OpenRouter/OpenAI)',
      },
    },
    {
      name: 'aiApiKey',
      type: 'text',
      label: 'API Key',
      admin: {
        description: 'Секретный ключ для доступа к API',
      },
    },
    {
      name: 'aiTextModel',
      type: 'text',
      label: 'Модель для текста',
      defaultValue: 'openai/gpt-4.1-mini',
      admin: {
        description: 'Например: openai/gpt-4.1-mini, anthropic/claude-3.5-sonnet, google/gemini-2.0-flash',
      },
    },
    {
      name: 'aiImageModel',
      type: 'text',
      label: 'Модель для картинок',
      defaultValue: 'openai/dall-e-3',
      admin: {
        description: 'Например: openai/dall-e-3, stability/sdxl',
      },
    },
    {
      name: 'aiTemperature',
      type: 'number',
      label: 'Temperature',
      defaultValue: 0.7,
      min: 0,
      max: 2,
      admin: {
        description: 'Креативность генерации (0 = точно, 2 = максимально креативно)',
        step: 0.1,
      },
    },
    {
      name: 'aiMaxTokens',
      type: 'number',
      label: 'Max Tokens',
      defaultValue: 2000,
      min: 100,
      max: 16000,
      admin: {
        description: 'Максимальная длина ответа в токенах',
      },
    },
  ],
}
