'use client'

import { createClientFeature } from '@payloadcms/richtext-lexical/client'
import { AIAssistantPlugin } from './AIAssistantPlugin'

export const AIAssistantFeatureClient = createClientFeature({
  plugins: [
    {
      Component: AIAssistantPlugin,
      position: 'normal',
    },
  ],
})
