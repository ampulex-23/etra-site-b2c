/**
 * Notification system — sends push notifications via Telegram Bot API.
 * Uses the customer's telegram.chatId field.
 * 
 * Bot token is read from ShopSettings global (telegramBotToken).
 */

const TELEGRAM_API = 'https://api.telegram.org'

interface SendNotificationOptions {
  chatId: string | number
  text: string
  parseMode?: 'HTML' | 'MarkdownV2'
  botToken: string
}

export async function sendTelegramMessage(opts: SendNotificationOptions): Promise<boolean> {
  const { chatId, text, parseMode = 'HTML', botToken } = opts

  if (!botToken || !chatId) {
    console.warn('[notifications] Missing botToken or chatId, skipping notification')
    return false
  }

  try {
    const res = await fetch(`${TELEGRAM_API}/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
        disable_web_page_preview: true,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error(`[notifications] Telegram API error ${res.status}: ${body}`)
      return false
    }

    return true
  } catch (err) {
    console.error('[notifications] Error sending Telegram message:', err)
    return false
  }
}

/**
 * Get Telegram bot token from ShopSettings global.
 */
export async function getBotToken(payload: any): Promise<string | null> {
  try {
    const settings = await payload.findGlobal({
      slug: 'shop-settings',
      depth: 0,
    })
    return settings?.telegramBotToken || null
  } catch {
    return null
  }
}

/**
 * Get customer's Telegram chatId.
 */
export function getCustomerChatId(customer: any): string | null {
  if (!customer) return null
  return customer.telegram?.chatId || null
}

// --- High-level notification helpers ---

export async function notifyEnrollmentActivated(
  payload: any,
  enrollment: any,
  siteUrl: string = process.env.NEXT_PUBLIC_SITE_URL || 'https://etraproject.ru',
) {
  const botToken = await getBotToken(payload)
  if (!botToken) return

  const customer =
    typeof enrollment.customer === 'object'
      ? enrollment.customer
      : await payload.findByID({ collection: 'customers', id: enrollment.customer, depth: 0 })

  const chatId = getCustomerChatId(customer)
  if (!chatId) return

  const cohort =
    typeof enrollment.cohort === 'object'
      ? enrollment.cohort
      : await payload.findByID({ collection: 'course-cohorts', id: enrollment.cohort, depth: 1 })

  const courseName = typeof cohort?.infoproduct === 'object'
    ? cohort.infoproduct.title
    : 'курс'

  await sendTelegramMessage({
    chatId,
    botToken,
    text:
      `🎉 <b>Ваш курс стартовал!</b>\n\n` +
      `Курс: ${courseName}\n` +
      `Поток: ${cohort?.title || ''}\n\n` +
      `Перейдите в личный кабинет, чтобы начать:\n` +
      `${siteUrl}/account`,
  })
}

export async function notifyReportReminder(
  payload: any,
  enrollment: any,
  siteUrl: string = process.env.NEXT_PUBLIC_SITE_URL || 'https://etraproject.ru',
) {
  const botToken = await getBotToken(payload)
  if (!botToken) return

  const customer =
    typeof enrollment.customer === 'object'
      ? enrollment.customer
      : await payload.findByID({ collection: 'customers', id: enrollment.customer, depth: 0 })

  const chatId = getCustomerChatId(customer)
  if (!chatId) return

  await sendTelegramMessage({
    chatId,
    botToken,
    text:
      `📝 <b>Напоминание об отчёте</b>\n\n` +
      `Не забудьте сдать ежедневный отчёт!\n` +
      `${siteUrl}/account`,
  })
}

export async function notifyEnrollmentExpelled(
  payload: any,
  enrollment: any,
  siteUrl: string = process.env.NEXT_PUBLIC_SITE_URL || 'https://etraproject.ru',
) {
  const botToken = await getBotToken(payload)
  if (!botToken) return

  const customer =
    typeof enrollment.customer === 'object'
      ? enrollment.customer
      : await payload.findByID({ collection: 'customers', id: enrollment.customer, depth: 0 })

  const chatId = getCustomerChatId(customer)
  if (!chatId) return

  await sendTelegramMessage({
    chatId,
    botToken,
    text:
      `⚠️ <b>Участие приостановлено</b>\n\n` +
      `К сожалению, вы были исключены из курса из-за пропущенных отчётов.\n` +
      `Свяжитесь с поддержкой для уточнения деталей.\n` +
      `${siteUrl}/account`,
  })
}

export async function notifyResultPublished(
  payload: any,
  enrollment: any,
  siteUrl: string = process.env.NEXT_PUBLIC_SITE_URL || 'https://etraproject.ru',
) {
  const botToken = await getBotToken(payload)
  if (!botToken) return

  const customer =
    typeof enrollment.customer === 'object'
      ? enrollment.customer
      : await payload.findByID({ collection: 'customers', id: enrollment.customer, depth: 0 })

  const chatId = getCustomerChatId(customer)
  if (!chatId) return

  await sendTelegramMessage({
    chatId,
    botToken,
    text:
      `✅ <b>Ваш результат опубликован!</b>\n\n` +
      `Ваш результат прошёл модерацию и опубликован на сайте.\n` +
      `${siteUrl}/account`,
  })
}
