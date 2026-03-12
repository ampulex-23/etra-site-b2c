'use client'

import React from 'react'
import { useScrollReveal } from './useScrollReveal'

export function PageWrapper({ children }: { children: React.ReactNode }) {
  useScrollReveal()
  return <>{children}</>
}
