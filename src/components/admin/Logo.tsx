'use client'

import React from 'react'

const Logo: React.FC = () => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <img
        src="/images/logo.png"
        alt="ЭТРА"
        style={{ height: '36px', width: 'auto' }}
      />
    </div>
  )
}

export default Logo
