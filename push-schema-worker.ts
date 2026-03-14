import 'dotenv/config'
import config from './src/payload.config'
import { getPayload } from 'payload'

console.log('[push-schema] Initializing Payload with push:true...')
const p = await getPayload({ config })
console.log('[push-schema] Schema push complete')
process.exit(0)
