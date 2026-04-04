import type { CollectionBeforeChangeHook } from 'payload'
import crypto from 'crypto'

function generateReferralCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase()
}

export const customerBeforeChange: CollectionBeforeChangeHook = async ({
  data,
  operation,
  req,
}) => {
  if (operation === 'create' && !data.referralCode) {
    data.referralCode = generateReferralCode()
  }

  if (data.experiencePoints !== undefined) {
    try {
      const referralSettings = await req.payload.findGlobal({
        slug: 'referral-settings' as any,
      })

      const settings = referralSettings as any
      if (settings?.enabled && settings?.levels?.length) {
        const levels = [...settings.levels].sort(
          (a: any, b: any) => (b.minPoints || 0) - (a.minPoints || 0)
        )

        const currentLevel = levels.find(
          (level: any) => (data.experiencePoints || 0) >= (level.minPoints || 0)
        )

        if (currentLevel) {
          data.referralLevel = currentLevel.name
          data.referralDiscount = currentLevel.discountPercent || 0
        }
      }
    } catch (error) {
      console.error('Error calculating referral level:', error)
    }
  }

  return data
}
