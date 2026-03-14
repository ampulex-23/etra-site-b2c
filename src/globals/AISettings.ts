import type { GlobalConfig } from 'payload'

export const AISettings: GlobalConfig = {
  slug: 'ai-settings',
  label: 'ИИ Агент',
  admin: {
    group: '⚙️ Настройки',
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
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
      type: 'select',
      label: 'Модель для текста',
      defaultValue: 'openai/gpt-4.1-mini',
      options: [
        { label: 'GPT-4.1 Mini (OpenAI)', value: 'openai/gpt-4.1-mini' },
        { label: 'GPT-4.1 (OpenAI)', value: 'openai/gpt-4.1' },
        { label: 'GPT-4o (OpenAI)', value: 'openai/gpt-4o' },
        { label: 'GPT-4o Mini (OpenAI)', value: 'openai/gpt-4o-mini' },
        { label: 'Claude 3.5 Sonnet (Anthropic)', value: 'anthropic/claude-3.5-sonnet' },
        { label: 'Claude 3.5 Haiku (Anthropic)', value: 'anthropic/claude-3.5-haiku' },
        { label: 'Gemini 2.0 Flash (Google)', value: 'google/gemini-2.0-flash' },
        { label: 'Gemini 2.5 Pro (Google)', value: 'google/gemini-2.5-pro' },
        { label: 'DeepSeek V3', value: 'deepseek/deepseek-chat-v3' },
        { label: 'Llama 3.1 70B (Meta)', value: 'meta-llama/llama-3.1-70b-instruct' },
      ],
      admin: {
        description: 'Модель для генерации текстов (описания товаров, статьи, SEO)',
      },
    },
    {
      name: 'aiImageModel',
      type: 'select',
      label: 'Модель для картинок',
      defaultValue: 'openai/dall-e-3',
      options: [
        { label: 'DALL-E 3 (OpenAI)', value: 'openai/dall-e-3' },
        { label: 'GPT-4o Image (OpenAI)', value: 'openai/gpt-4o' },
        { label: 'Stable Diffusion XL', value: 'stability/sdxl' },
        { label: 'Stable Diffusion 3', value: 'stability/sd3' },
        { label: 'Flux Pro (Black Forest Labs)', value: 'black-forest-labs/flux-pro' },
        { label: 'Flux Schnell (Black Forest Labs)', value: 'black-forest-labs/flux-schnell' },
        { label: 'Midjourney (через API)', value: 'midjourney/midjourney' },
      ],
      admin: {
        description: 'Модель для генерации и редактирования изображений',
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
