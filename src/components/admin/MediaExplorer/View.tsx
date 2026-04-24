import React, { Suspense } from 'react'
import { Gutter } from '@payloadcms/ui'
import type { AdminViewProps } from 'payload'

import MediaExplorerClient from './Explorer.client'

/**
 * RSC wrapper that Payload registers as the collection "list" view for Media.
 * It renders shell chrome (gutter + heading) and delegates the interactive
 * explorer UI to a client component. The Suspense boundary is required by
 * Next.js because the client component reads search params.
 */
const MediaExplorerView: React.FC<AdminViewProps> = () => {
  return (
    <Gutter>
      <Suspense fallback={<div style={{ padding: '1rem' }}>Загрузка…</div>}>
        <MediaExplorerClient />
      </Suspense>
    </Gutter>
  )
}

export default MediaExplorerView
