import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Validates customer-submitted results:
 * - Enrollment must belong to the customer
 * - Enrollment must be active or completed
 * - Forces status to 'pending' (customers cannot self-publish)
 */
export const resultBeforeChange: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
}) => {
  if (operation !== 'create') return data

  const { user, payload } = req
  if (!user || user.collection !== 'customers') return data

  const enrollmentId =
    typeof data.enrollment === 'object' ? data.enrollment.id : data.enrollment
  if (!enrollmentId) {
    throw new Error('Не указана запись на курс')
  }

  // Verify enrollment belongs to this customer
  const enrollment = await (payload as any).findByID({
    collection: 'enrollments',
    id: enrollmentId,
    depth: 0,
  })

  if (!enrollment) {
    throw new Error('Запись на курс не найдена')
  }

  const enrollmentCustomerId =
    typeof enrollment.customer === 'object'
      ? enrollment.customer.id
      : enrollment.customer

  if (enrollmentCustomerId !== user.id) {
    throw new Error('Эта запись на курс принадлежит другому участнику')
  }

  if (enrollment.status !== 'active' && enrollment.status !== 'completed') {
    throw new Error('Запись на курс не активна')
  }

  // Force status to pending — customers cannot self-publish
  data.status = 'pending'

  // Force enrollment to validated one
  data.enrollment = enrollmentId

  return data
}
