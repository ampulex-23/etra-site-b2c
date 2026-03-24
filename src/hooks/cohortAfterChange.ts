import type { CollectionAfterChangeHook } from 'payload'

export const cohortAfterChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  operation,
}) => {
  const { payload } = req

  // Only trigger when status changes to 'active'
  const statusChanged =
    operation === 'update' &&
    previousDoc?.status !== 'active' &&
    doc.status === 'active'

  const isNewActive = operation === 'create' && doc.status === 'active'

  if (!statusChanged && !isNewActive) return doc

  try {
    // Check if days already exist for this cohort
    const existingDays = await (payload as any).find({
      collection: 'course-days',
      where: { cohort: { equals: doc.id } },
      limit: 1,
      depth: 0,
    })

    if (existingDays.totalDocs > 0) {
      console.log(
        `[cohortAfterChange] Cohort ${doc.id} already has ${existingDays.totalDocs} days, skipping generation`,
      )
      return doc
    }

    // Get infoproduct to read durationDays and schedule template
    const infoproductId =
      typeof doc.infoproduct === 'object' ? doc.infoproduct.id : doc.infoproduct
    if (!infoproductId) return doc

    const infoproduct = await (payload as any).findByID({
      collection: 'infoproducts',
      id: infoproductId,
      depth: 0,
    })

    if (!infoproduct) return doc

    const durationDays = infoproduct.durationDays || 30
    const startDate = new Date(doc.startDate)

    console.log(
      `[cohortAfterChange] Generating ${durationDays} days for cohort "${doc.title}" (${doc.id})`,
    )

    // Generate days
    for (let i = 1; i <= durationDays; i++) {
      const dayDate = new Date(startDate)
      dayDate.setDate(dayDate.getDate() + (i - 1))

      await (payload as any).create({
        collection: 'course-days',
        data: {
          cohort: doc.id,
          dayNumber: i,
          date: dayDate.toISOString(),
          title: `День ${i}`,
          // Copy schedule template from infoproduct (as default)
          morningBlock: infoproduct.scheduleMorning || undefined,
          dayBlock: infoproduct.scheduleDay || undefined,
          eveningBlock: infoproduct.scheduleEvening || undefined,
        },
        depth: 0,
      })
    }

    // Auto-set endDate if not set
    if (!doc.endDate) {
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + durationDays - 1)

      await (payload as any).update({
        collection: 'course-cohorts',
        id: doc.id,
        data: { endDate: endDate.toISOString() },
        depth: 0,
      })
    }

    console.log(
      `[cohortAfterChange] Successfully generated ${durationDays} days for cohort "${doc.title}"`,
    )
  } catch (error) {
    console.error('[cohortAfterChange] Error generating course days:', error)
  }

  return doc
}
