import { postgresAdapter } from '@payloadcms/db-postgres'
import { s3Storage } from '@payloadcms/storage-s3'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { AIAssistantFeature } from './features/ai-assistant/feature.server'
import { ru } from '@payloadcms/translations/languages/ru'
import fs from 'fs'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Products } from './collections/Products'
import { Categories } from './collections/Categories'
import { Orders } from './collections/Orders'
import { Customers } from './collections/Customers'
import { Posts } from './collections/Posts'
import { PromoCodes } from './collections/PromoCodes'
import { Deliveries } from './collections/Deliveries'
import { Payments } from './collections/Payments'
import { Recipes } from './collections/Recipes'
import { Warehouses } from './collections/Warehouses'
import { StockMovements } from './collections/StockMovements'
import { StockLevels } from './collections/StockLevels'
import { Inventories } from './collections/Inventories'
import { Reviews } from './collections/Reviews'
import { Comments } from './collections/Comments'
import { Infoproducts } from './collections/infoproducts/Infoproducts'
import { CourseCohorts } from './collections/infoproducts/CourseCohorts'
import { CourseModules } from './collections/infoproducts/CourseModules'
import { CourseDays } from './collections/infoproducts/CourseDays'
import { Enrollments } from './collections/infoproducts/Enrollments'
import { ParticipantReports } from './collections/infoproducts/ParticipantReports'
import { CourseResults } from './collections/infoproducts/CourseResults'
import { AISettings } from './globals/AISettings'
import { DeliverySettings } from './globals/DeliverySettings'
import { LandingSettings } from './globals/LandingSettings'
import { ShopSettings } from './globals/ShopSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || '',
  cors: [
    process.env.NEXT_PUBLIC_SERVER_URL || '',
    'https://etraproject.ru',
    'http://localhost:3000',
  ].filter(Boolean),
  csrf: [
    process.env.NEXT_PUBLIC_SERVER_URL || '',
    'https://etraproject.ru',
    'http://localhost:3000',
  ].filter(Boolean),
  i18n: {
    supportedLanguages: { ru },
    fallbackLanguage: 'ru',
  },
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' | ЭТРА',
      icons: [{ url: '/images/logo.png' }],
      openGraph: {
        images: [{ url: '/images/logo.png' }],
      },
    },
    components: {
      graphics: {
        Logo: '@/components/admin/Logo',
        Icon: '@/components/admin/Icon',
      },
      afterNavLinks: ['@/components/admin/NavIcons'],
    },
  },
  collections: [
    Users,
    Media,
    Products,
    Categories,
    Orders,
    Customers,
    Posts,
    PromoCodes,
    Deliveries,
    Payments,
    Recipes,
    Warehouses,
    StockMovements,
    StockLevels,
    Inventories,
    Reviews,
    Comments,
    Infoproducts,
    CourseCohorts,
    CourseModules,
    CourseDays,
    Enrollments,
    ParticipantReports,
    CourseResults,
  ],
  globals: [
    AISettings,
    DeliverySettings,
    LandingSettings,
    ShopSettings,
  ],
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [...defaultFeatures, AIAssistantFeature()],
  }),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    push: true,
    pool: {
      connectionString: process.env.DATABASE_URL || '',
      ssl: process.env.DATABASE_CA_PATH
        ? { ca: fs.readFileSync(process.env.DATABASE_CA_PATH, 'utf-8') }
        : { rejectUnauthorized: false },
    },
  }),
  sharp,
  plugins: [
    s3Storage({
      collections: {
        media: {
          prefix: 'media',
        },
      },
      bucket: process.env.S3_BUCKET || '',
      config: {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY || '',
          secretAccessKey: process.env.S3_SECRET_KEY || '',
        },
        region: process.env.S3_REGION || 'ru-1',
        endpoint: process.env.S3_ENDPOINT || '',
        forcePathStyle: true,
      },
    }),
  ],
})
