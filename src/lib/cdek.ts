/**
 * CDEK API 2.0 Integration Library
 * Docs: https://apidoc.cdek.ru/
 *
 * Handles: OAuth auth, tariff calculation, order creation,
 * order tracking, delivery points (PVZ) lookup, city search.
 */

const CDEK_API_PROD = 'https://api.cdek.ru/v2'
const CDEK_API_TEST = 'https://api.edu.cdek.ru/v2'
const CDEK_AUTH_PROD = 'https://api.cdek.ru/v2/oauth/token'
const CDEK_AUTH_TEST = 'https://api.edu.cdek.ru/v2/oauth/token'

// Test credentials from CDEK docs (updated 2024)
// Source: https://github.com/AntistressStore/cdek-sdk-v2/blob/master/src/Constants.php
const CDEK_TEST_CLIENT_ID = 'wqGwiQx0gg8mLtiEKsUinjVSICCjtTEP'
const CDEK_TEST_SECRET = 'RmAmgvSgSl1yirlz9QupbzOJVqhCxcP5'

// Token cache
let tokenCache: { token: string; expiresAt: number } | null = null

export interface CdekConfig {
  clientId: string
  clientSecret: string
  testMode: boolean
  senderCityCode: string
  defaultTariffCode: number
}

export interface CdekTariffRequest {
  tariff_code?: number
  from_location: { code?: number; postal_code?: string; address?: string }
  to_location: { code?: number; postal_code?: string; address?: string }
  packages: { weight: number; length?: number; width?: number; height?: number }[]
  services?: { code: string; parameter?: string }[]
}

export interface CdekTariffResponse {
  delivery_sum: number
  period_min: number
  period_max: number
  weight_calc: number
  currency: string
  total_sum: number
  services?: { code: string; sum: number }[]
  errors?: { code: string; message: string }[]
}

export interface CdekTariffListRequest {
  from_location: { code?: number; postal_code?: string }
  to_location: { code?: number; postal_code?: string }
  packages: { weight: number; length?: number; width?: number; height?: number }[]
}

export interface CdekTariffListItem {
  tariff_code: number
  tariff_name: string
  tariff_description: string
  delivery_mode: number
  delivery_sum: number
  period_min: number
  period_max: number
}

export interface CdekOrderRequest {
  type?: number // 1 = online store (default), 2 = delivery
  number: string
  tariff_code: number
  comment?: string
  sender?: {
    company?: string
    name: string
    phones: { number: string }[]
  }
  recipient: {
    name: string
    phones: { number: string }[]
    email?: string
  }
  from_location: {
    code?: string
    postal_code?: string
    city?: string
    address: string
  }
  to_location: {
    code?: string
    postal_code?: string
    city?: string
    address?: string
  }
  delivery_point?: string // PVZ code for tariffs ending at pickup point
  packages: {
    number: string
    weight: number
    length?: number
    width?: number
    height?: number
    comment?: string
    items?: {
      name: string
      ware_key: string
      payment: { value: number; currency?: string }
      cost: number
      weight: number
      amount: number
    }[]
  }[]
}

export interface CdekOrderResponse {
  entity?: {
    uuid: string
    cdek_number?: string
  }
  requests?: {
    request_uuid: string
    type: string
    state: string
    date_time: string
    errors?: { code: string; message: string }[]
    warnings?: { code: string; message: string }[]
  }[]
}

export interface CdekOrderInfo {
  entity?: {
    uuid: string
    cdek_number?: string
    is_return: boolean
    is_reverse: boolean
    type: number
    number: string
    tariff_code: number
    status_code: string
    status_reason?: string
    status_date_time: string
    delivery_point?: string
    statuses?: {
      code: string
      name: string
      date_time: string
      city?: string
    }[]
    delivery_detail?: {
      date: string
      recipient_name: string
      delivery_sum: number
      total_sum: number
    }
  }
  requests?: {
    request_uuid: string
    type: string
    state: string
    errors?: { code: string; message: string }[]
  }[]
}

export interface CdekDeliveryPoint {
  code: string
  name: string
  location: {
    country_code: string
    region_code: number
    region: string
    city_code: number
    city: string
    postal_code: string
    address: string
    address_full: string
    latitude: number
    longitude: number
  }
  address_comment?: string
  work_time: string
  phones?: { number: string }[]
  type: string // PVZ, POSTAMAT
  owner_code: string
  have_cashless: boolean
  have_cash: boolean
  is_dressing_room: boolean
  nearest_station?: string
  weight_min?: number
  weight_max?: number
}

export interface CdekCity {
  code: number
  city: string
  country_code: string
  region: string
  region_code: number
  sub_region?: string
  postal_codes?: string[]
  latitude: number
  longitude: number
}

function getBaseUrl(testMode: boolean): string {
  return testMode ? CDEK_API_TEST : CDEK_API_PROD
}

function getAuthUrl(testMode: boolean): string {
  return testMode ? CDEK_AUTH_TEST : CDEK_AUTH_PROD
}

/**
 * Get OAuth 2.0 access token (cached until expiration)
 */
export async function getToken(config: CdekConfig): Promise<string> {
  // Check if cached token is valid AND matches current mode
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    console.log('[CDEK] Using cached token')
    return tokenCache.token
  }

  // Clear cache if switching modes or expired
  if (tokenCache) {
    console.log('[CDEK] Token expired or mode changed, clearing cache')
    tokenCache = null
  }

  const clientId = config.testMode ? CDEK_TEST_CLIENT_ID : config.clientId
  const clientSecret = config.testMode ? CDEK_TEST_SECRET : config.clientSecret
  const authUrl = getAuthUrl(config.testMode)

  console.log('[CDEK] Auth request:', {
    testMode: config.testMode,
    authUrl,
    clientIdPrefix: clientId.substring(0, 8) + '...',
    usingTestCredentials: config.testMode,
  })

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  })

  const res = await fetch(authUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error('[CDEK] Auth failed:', { status: res.status, response: text })
    // Clear any cached token on auth failure
    tokenCache = null
    throw new Error(`CDEK auth failed (${res.status}): ${text}`)
  }

  const data = await res.json()
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000, // refresh 60s before expiry
  }

  return data.access_token
}

/**
 * Invalidate cached token
 */
export function clearTokenCache(): void {
  tokenCache = null
}

/**
 * Make authenticated request to CDEK API
 */
async function cdekFetch<T>(
  config: CdekConfig,
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const token = await getToken(config)
  const baseUrl = getBaseUrl(config.testMode)

  const options: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(body)
  }

  const url = path.startsWith('http') ? path : `${baseUrl}${path}`
  const res = await fetch(url, options)

  if (!res.ok) {
    const text = await res.text()
    clearTokenCache()
    throw new Error(`CDEK API error (${res.status}): ${text}`)
  }

  return res.json()
}

/**
 * Calculate delivery cost by single tariff code
 */
export async function calculateTariff(
  config: CdekConfig,
  request: CdekTariffRequest,
): Promise<CdekTariffResponse> {
  return cdekFetch<CdekTariffResponse>(config, 'POST', '/calculator/tariff', request)
}

/**
 * Calculate delivery cost by all available tariffs
 */
export async function calculateTariffList(
  config: CdekConfig,
  request: CdekTariffListRequest,
): Promise<{ tariff_codes: CdekTariffListItem[] }> {
  return cdekFetch<{ tariff_codes: CdekTariffListItem[] }>(
    config,
    'POST',
    '/calculator/tarifflist',
    request,
  )
}

/**
 * Create CDEK delivery order
 */
export async function createOrder(
  config: CdekConfig,
  order: CdekOrderRequest,
): Promise<CdekOrderResponse> {
  return cdekFetch<CdekOrderResponse>(config, 'POST', '/orders', order)
}

/**
 * Get order info by UUID
 */
export async function getOrderByUuid(
  config: CdekConfig,
  uuid: string,
): Promise<CdekOrderInfo> {
  return cdekFetch<CdekOrderInfo>(config, 'GET', `/orders/${uuid}`)
}

/**
 * Get order info by CDEK number
 */
export async function getOrderByCdekNumber(
  config: CdekConfig,
  cdekNumber: string,
): Promise<CdekOrderInfo> {
  return cdekFetch<CdekOrderInfo>(config, 'GET', `/orders?cdek_number=${cdekNumber}`)
}

/**
 * Delete (cancel) order by UUID
 */
export async function deleteOrder(
  config: CdekConfig,
  uuid: string,
): Promise<CdekOrderResponse> {
  return cdekFetch<CdekOrderResponse>(config, 'DELETE', `/orders/${uuid}`)
}

/**
 * Get delivery points (PVZ/POSTAMAT)
 */
export async function getDeliveryPoints(
  config: CdekConfig,
  params: {
    city_code?: number
    postal_code?: string
    type?: 'PVZ' | 'POSTAMAT' | 'ALL'
    country_code?: string
    size?: number
    page?: number
  },
): Promise<CdekDeliveryPoint[]> {
  const query = new URLSearchParams()
  if (params.city_code) query.set('city_code', String(params.city_code))
  if (params.postal_code) query.set('postal_code', params.postal_code)
  if (params.type) query.set('type', params.type)
  if (params.country_code) query.set('country_code', params.country_code)
  if (params.size) query.set('size', String(params.size))
  if (params.page) query.set('page', String(params.page))

  return cdekFetch<CdekDeliveryPoint[]>(config, 'GET', `/deliverypoints?${query.toString()}`)
}

/**
 * Search cities
 */
export async function searchCities(
  config: CdekConfig,
  params: {
    city?: string
    country_codes?: string
    size?: number
    page?: number
  },
): Promise<CdekCity[]> {
  const query = new URLSearchParams()
  if (params.city) query.set('city', params.city)
  if (params.country_codes) query.set('country_codes', params.country_codes)
  if (params.size) query.set('size', String(params.size))
  if (params.page) query.set('page', String(params.page))

  return cdekFetch<CdekCity[]>(config, 'GET', `/location/cities?${query.toString()}`)
}

/**
 * Register webhook
 */
export async function registerWebhook(
  config: CdekConfig,
  params: {
    url: string
    type: 'ORDER_STATUS' | 'PRINT_FORM' | 'DOWNLOAD_PHOTO' | 'PREALERT_CLOSED'
  },
): Promise<{ entity: { uuid: string }; requests: unknown[] }> {
  return cdekFetch(config, 'POST', '/webhooks', params)
}

/**
 * List webhooks
 */
export async function listWebhooks(
  config: CdekConfig,
): Promise<{ entity: { uuid: string; url: string; type: string }[] }> {
  return cdekFetch(config, 'GET', '/webhooks')
}

/**
 * Delete webhook
 */
export async function deleteWebhook(
  config: CdekConfig,
  uuid: string,
): Promise<void> {
  await cdekFetch(config, 'DELETE', `/webhooks/${uuid}`)
}

/**
 * Helper: load CDEK config from Payload DeliverySettings
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getCdekConfigFromPayload(payload: any): Promise<CdekConfig> {
  const settings = await payload.findGlobal({ slug: 'delivery-settings', depth: 0 })

  console.log('[CDEK] DeliverySettings loaded:', {
    cdekEnabled: settings.cdekEnabled,
    cdekTestMode: settings.cdekTestMode,
    cdekAccount: settings.cdekAccount ? 'set' : 'empty',
    cdekSecurePassword: settings.cdekSecurePassword ? 'set' : 'empty',
    cdekSenderCity: settings.cdekSenderCity,
  })

  if (!settings.cdekEnabled) {
    throw new Error('CDEK integration is disabled')
  }

  // If no production credentials are set, force test mode
  const hasProductionCredentials = Boolean(settings.cdekAccount && settings.cdekSecurePassword)
  const explicitTestMode = Boolean(settings.cdekTestMode)
  const useTestMode = explicitTestMode || !hasProductionCredentials

  const config = {
    clientId: (settings.cdekAccount as string) || '',
    clientSecret: (settings.cdekSecurePassword as string) || '',
    testMode: useTestMode,
    senderCityCode: (settings.cdekSenderCity as string) || '44',
    defaultTariffCode: (settings.cdekTariffCode as number) || 139,
  }

  if (!hasProductionCredentials) {
    console.log('[CDEK] No production credentials set, using test mode with built-in credentials')
  } else if (explicitTestMode) {
    console.log('[CDEK] Test mode explicitly enabled in settings')
  } else {
    console.log('[CDEK] Using production mode with provided credentials')
  }

  console.log('[CDEK] Config created:', { ...config, clientSecret: config.clientSecret ? '***' : 'empty' })

  return config
}
