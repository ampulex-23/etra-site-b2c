import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Пустой хук перед изменением клиента.
 * Старая логика (генерация реферального кода, расчёт уровня по очкам) удалена.
 * В новой реферальной программе промокод генерируется в ReferralPartners.
 */
export const customerBeforeChange: CollectionBeforeChangeHook = async ({
  data,
}) => {
  return data
}
