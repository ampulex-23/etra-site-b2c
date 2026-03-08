import { createServerFeature } from '@payloadcms/richtext-lexical'

export const AIAssistantFeature = createServerFeature({
  key: 'aiAssistant',
  feature: {
    ClientFeature: '@/features/ai-assistant/feature.client#AIAssistantFeatureClient',
  },
})
