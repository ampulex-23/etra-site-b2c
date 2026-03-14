/**
 * Push DB schema using Payload's push:true mechanism.
 * Runs before the Next.js server starts to ensure all tables/columns exist.
 * Executes push-schema-worker.ts via tsx.
 */
import { execSync } from 'child_process'

try {
  console.log('[push-schema] Starting DB schema sync...')
  execSync('node --import=tsx/esm push-schema-worker.ts', {
    stdio: 'inherit',
    cwd: process.cwd(),
    timeout: 120000,
  })
  console.log('[push-schema] Done')
} catch (err) {
  console.error('[push-schema] Warning: schema push failed:', err.message)
  console.error('[push-schema] Server will start anyway')
}
