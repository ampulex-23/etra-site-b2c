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
      defaultValue: 'google/gemini-3-pro-image-preview',
      options: [
        { label: 'Nano Banana Pro (Gemini 3 Pro Image)', value: 'google/gemini-3-pro-image-preview' },
        { label: 'Nano Banana 2 (Gemini 3.1 Flash Image)', value: 'google/gemini-3.1-flash-image-preview' },
        { label: 'Nano Banana (Gemini 2.5 Flash Image)', value: 'google/gemini-2.5-flash-image' },
        { label: 'GPT-5 Image (OpenAI)', value: 'openai/gpt-5-image' },
        { label: 'GPT-5 Image Mini (OpenAI)', value: 'openai/gpt-5-image-mini' },
        { label: 'GPT Image 1.5 (OpenAI)', value: 'openai/gpt-image-1.5' },
        { label: 'Seedream 5.0 Lite (ByteDance)', value: 'bytedance/seedream-5-lite' },
        { label: 'Seedream 4.5 (ByteDance)', value: 'bytedance/seedream-4.5' },
        { label: 'Flux-2 Pro (Black Forest Labs)', value: 'black-forest-labs/flux.2-pro' },
        { label: 'Flux-2 Flex (Black Forest Labs)', value: 'black-forest-labs/flux.2-flex' },
        { label: 'Grok Image (xAI)', value: 'x-ai/grok-imagine-image' },
        { label: 'Topaz Upscale', value: 'topaz/image-upscale' },
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
