'use client'

import React from 'react'

/**
 * Field renderer that renders nothing. Used to hide a field from the edit
 * form while keeping its Cell in the list view (Payload's `admin.hidden`
 * hides the field everywhere, which is not what we want for denormalised
 * stat columns like `orderCount` / `orderTotalSum`).
 */
const HiddenField: React.FC = () => null

export default HiddenField
