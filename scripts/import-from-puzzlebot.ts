/**
 * Скрипт миграции клиентов и заказов из PuzzleBot в Payload CMS
 *
 * Использование:
 *   1. Экспортировать данные из PuzzleBot (CSV или JSON)
 *   2. Положить файлы в scripts/data/
 *   3. Запустить: npx tsx scripts/import-from-puzzlebot.ts
 *
 * Формат входных данных:
 *   - scripts/data/customers.json  — массив клиентов из PuzzleBot
 *   - scripts/data/orders.json     — массив заказов из PuzzleBot
 *
 * Структура клиента PuzzleBot (ожидаемая):
 * {
 *   "id": "pb_123",
 *   "telegram_id": "123456789",
 *   "username": "john_doe",
 *   "first_name": "Иван",
 *   "last_name": "Петров",
 *   "phone": "+79001234567",
 *   "email": "",
 *   "variables": { ... }
 * }
 *
 * Структура заказа PuzzleBot (ожидаемая):
 * {
 *   "id": "order_456",
 *   "user_id": "pb_123",           // или telegram_id
 *   "telegram_id": "123456789",
 *   "items": [
 *     { "name": "Закваска Эвиталия", "quantity": 2, "price": 350 }
 *   ],
 *   "total": 700,
 *   "status": "completed",
 *   "address": "...",
 *   "created_at": "2024-01-15T10:00:00Z",
 *   "notes": "..."
 * }
 */

import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import crypto from 'crypto'

const DATA_DIR = path.resolve(__dirname, 'data')
const LOG_FILE = path.resolve(__dirname, 'migration-log.json')

interface PuzzleBotCustomer {
  id: string
  telegram_id: string
  username?: string
  first_name?: string
  last_name?: string
  phone?: string
  email?: string
  photo_url?: string
  variables?: Record<string, unknown>
}

interface PuzzleBotOrderItem {
  name: string
  quantity: number
  price: number
}

interface PuzzleBotOrder {
  id: string
  user_id?: string
  telegram_id: string
  items: PuzzleBotOrderItem[]
  total: number
  status?: string
  address?: string
  delivery_method?: string
  created_at?: string
  notes?: string
}

interface MigrationLog {
  startedAt: string
  completedAt?: string
  customers: {
    total: number
    imported: number
    skipped: number
    errors: Array<{ id: string; error: string }>
  }
  orders: {
    total: number
    imported: number
    skipped: number
    errors: Array<{ id: string; error: string }>
  }
  customerIdMap: Record<string, string> // puzzleBotId -> payloadId
  telegramIdMap: Record<string, string> // telegramId -> payloadCustomerId
}

function loadJson<T>(filename: string): T[] {
  const filePath = path.join(DATA_DIR, filename)
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Файл ${filename} не найден в ${DATA_DIR}`)
    return []
  }
  const raw = fs.readFileSync(filePath, 'utf-8')
  const data = JSON.parse(raw)
  return Array.isArray(data) ? data : data.data || data.items || data.results || []
}

function mapPuzzleBotStatus(status?: string): string {
  const statusMap: Record<string, string> = {
    new: 'new',
    pending: 'processing',
    processing: 'processing',
    paid: 'processing',
    shipped: 'shipped',
    delivered: 'delivered',
    completed: 'completed',
    cancelled: 'cancelled',
    refunded: 'cancelled',
  }
  return statusMap[status?.toLowerCase() || ''] || 'completed'
}

async function main() {
  console.log('🚀 Начинаем миграцию из PuzzleBot...\n')

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
    console.log(`📁 Создана папка ${DATA_DIR}`)
    console.log('   Положите файлы customers.json и orders.json в эту папку')
    console.log('   и перезапустите скрипт.\n')
    process.exit(0)
  }

  const payload = await getPayload({ config })

  const log: MigrationLog = {
    startedAt: new Date().toISOString(),
    customers: { total: 0, imported: 0, skipped: 0, errors: [] },
    orders: { total: 0, imported: 0, skipped: 0, errors: [] },
    customerIdMap: {},
    telegramIdMap: {},
  }

  // === 1. IMPORT CUSTOMERS ===
  const pbCustomers = loadJson<PuzzleBotCustomer>('customers.json')
  log.customers.total = pbCustomers.length
  console.log(`👥 Найдено клиентов: ${pbCustomers.length}`)

  for (const pbc of pbCustomers) {
    try {
      const telegramId = String(pbc.telegram_id || pbc.id)

      // Check if already exists by telegram.chatId
      const existing = await payload.find({
        collection: 'customers',
        where: { 'telegram.chatId': { equals: telegramId } },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        const doc = existing.docs[0] as unknown as Record<string, unknown>
        log.customerIdMap[pbc.id] = doc.id as string
        log.telegramIdMap[telegramId] = doc.id as string
        log.customers.skipped++
        console.log(`  ⏭️  ${pbc.first_name || telegramId} — уже существует`)
        continue
      }

      // Check by phone if available
      if (pbc.phone) {
        const byPhone = await payload.find({
          collection: 'customers',
          where: { phone: { equals: pbc.phone } },
          limit: 1,
        })
        if (byPhone.docs.length > 0) {
          const doc = byPhone.docs[0] as unknown as Record<string, unknown>
          // Update existing with telegram data
          await payload.update({
            collection: 'customers',
            id: doc.id as string,
            data: {
              telegram: {
                chatId: telegramId,
                username: pbc.username || '',
                firstName: pbc.first_name || '',
                lastName: pbc.last_name || '',
                phone: pbc.phone || '',
                photoUrl: pbc.photo_url || '',
              },
              source: 'telegram_bot',
              puzzleBotId: pbc.id,
              importedAt: new Date().toISOString(),
            } as any,
          })
          log.customerIdMap[pbc.id] = doc.id as string
          log.telegramIdMap[telegramId] = doc.id as string
          log.customers.imported++
          console.log(`  🔗 ${pbc.first_name || telegramId} — привязан к существующему (по телефону)`)
          continue
        }
      }

      // Create new customer
      const name = [pbc.first_name, pbc.last_name].filter(Boolean).join(' ') || `Клиент ${telegramId}`
      const email = pbc.email || `tg_${telegramId}@telegram.user`
      const tempPassword = crypto.randomBytes(32).toString('hex')

      const created = await payload.create({
        collection: 'customers',
        data: {
          email,
          password: tempPassword,
          name,
          phone: pbc.phone || '',
          source: 'telegram_bot',
          puzzleBotId: pbc.id,
          importedAt: new Date().toISOString(),
          telegram: {
            chatId: telegramId,
            username: pbc.username || '',
            firstName: pbc.first_name || '',
            lastName: pbc.last_name || '',
            phone: pbc.phone || '',
            photoUrl: pbc.photo_url || '',
          },
        } as any,
      })

      log.customerIdMap[pbc.id] = String(created.id)
      log.telegramIdMap[telegramId] = String(created.id)
      log.customers.imported++
      console.log(`  ✅ ${name} (tg:${telegramId})`)
    } catch (err: any) {
      log.customers.errors.push({ id: pbc.id, error: err.message })
      console.error(`  ❌ ${pbc.id}: ${err.message}`)
    }
  }

  console.log(`\n📊 Клиенты: импорт ${log.customers.imported}, пропущено ${log.customers.skipped}, ошибок ${log.customers.errors.length}\n`)

  // === 2. IMPORT ORDERS ===
  const pbOrders = loadJson<PuzzleBotOrder>('orders.json')
  log.orders.total = pbOrders.length
  console.log(`📦 Найдено заказов: ${pbOrders.length}`)

  let orderCounter = await payload.find({
    collection: 'orders',
    limit: 1,
    sort: '-createdAt',
  })
  let nextOrderNum = (orderCounter.docs.length > 0)
    ? parseInt(String((orderCounter.docs[0] as any).orderNumber || '0').replace(/\D/g, ''), 10) + 1
    : 1

  for (const pbo of pbOrders) {
    try {
      // Check if already imported
      const existingOrder = await payload.find({
        collection: 'orders',
        where: { puzzleBotOrderId: { equals: pbo.id } },
        limit: 1,
      })

      if (existingOrder.docs.length > 0) {
        log.orders.skipped++
        console.log(`  ⏭️  Заказ ${pbo.id} — уже импортирован`)
        continue
      }

      // Find customer
      const telegramId = String(pbo.telegram_id)
      const customerId = log.telegramIdMap[telegramId]
        || log.customerIdMap[pbo.user_id || '']

      if (!customerId) {
        log.orders.errors.push({ id: pbo.id, error: `Клиент не найден (tg:${telegramId})` })
        console.error(`  ❌ Заказ ${pbo.id}: клиент не найден (tg:${telegramId})`)
        continue
      }

      // Map items — try to find products by name
      const items = []
      for (const item of (pbo.items || [])) {
        const productSearch = await payload.find({
          collection: 'products',
          where: { title: { contains: item.name } },
          limit: 1,
        })

        if (productSearch.docs.length > 0) {
          items.push({
            product: productSearch.docs[0].id,
            quantity: item.quantity || 1,
            price: item.price || 0,
          })
        } else {
          // Store as text in notes if product not found
          items.push({
            product: null,
            variantName: item.name,
            quantity: item.quantity || 1,
            price: item.price || 0,
          })
        }
      }

      // Filter out items without product match — store in notes
      const matchedItems = items.filter((i) => i.product)
      const unmatchedItems = items.filter((i) => !i.product)
      const unmatchedNote = unmatchedItems.length > 0
        ? `\n[Импорт] Ненайденные товары: ${unmatchedItems.map((i) => `${i.variantName} x${i.quantity} @${i.price}₽`).join(', ')}`
        : ''

      const orderNumber = `PB-${String(nextOrderNum).padStart(5, '0')}`
      nextOrderNum++

      const orderData: Record<string, unknown> = {
        orderNumber,
        customer: customerId,
        items: matchedItems.length > 0
          ? matchedItems
          : [{ product: null, variantName: 'Импорт из бота', quantity: 1, price: pbo.total || 0 }],
        total: pbo.total || 0,
        subtotal: pbo.total || 0,
        status: mapPuzzleBotStatus(pbo.status),
        source: 'telegram_bot',
        puzzleBotOrderId: pbo.id,
        importedAt: new Date().toISOString(),
        notes: `Импортировано из PuzzleBot${unmatchedNote}${pbo.notes ? `\n${pbo.notes}` : ''}`,
      }

      if (pbo.address) {
        orderData.delivery = {
          address: pbo.address,
          method: pbo.delivery_method || 'pickup',
        }
      }

      await payload.create({
        collection: 'orders',
        data: orderData as any,
        overrideAccess: true,
      })

      log.orders.imported++
      console.log(`  ✅ ${orderNumber} (${pbo.total}₽, клиент tg:${telegramId})`)
    } catch (err: any) {
      log.orders.errors.push({ id: pbo.id, error: err.message })
      console.error(`  ❌ Заказ ${pbo.id}: ${err.message}`)
    }
  }

  console.log(`\n📊 Заказы: импорт ${log.orders.imported}, пропущено ${log.orders.skipped}, ошибок ${log.orders.errors.length}\n`)

  // Save log
  log.completedAt = new Date().toISOString()
  fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2), 'utf-8')
  console.log(`📝 Лог миграции сохранён: ${LOG_FILE}`)

  console.log('\n✅ Миграция завершена!')
  console.log(`   Клиенты: ${log.customers.imported} создано, ${log.customers.skipped} пропущено`)
  console.log(`   Заказы:  ${log.orders.imported} создано, ${log.orders.skipped} пропущено`)

  if (log.customers.errors.length || log.orders.errors.length) {
    console.log(`\n⚠️  Ошибки: ${log.customers.errors.length + log.orders.errors.length} шт. — см. ${LOG_FILE}`)
  }

  process.exit(0)
}

main().catch((err) => {
  console.error('💥 Критическая ошибка:', err)
  process.exit(1)
})
