'use client'

import React from 'react'
import { SupportChatView } from '../../components/support/SupportChatView'

export default function AccountSupportPage() {
  return (
    <div className="pwa-screen pwa-screen--flush chat-screen">
      <SupportChatView mode="page" />
    </div>
  )
}
