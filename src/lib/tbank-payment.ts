/**
 * T-Bank (Tinkoff) Internet Acquiring API Integration
 * 
 * Documentation: https://developer.tbank.ru/eacq/api/init
 * 
 * Flow:
 * 1. Backend calls Init method to create payment
 * 2. User is redirected to PaymentURL from response
 * 3. User completes payment on T-Bank payment form
 * 4. T-Bank sends notification to NotificationURL
 * 5. User is redirected to SuccessURL or FailURL
 */

import crypto from 'crypto'

// Environment variables (set in .env.local)
const TBANK_TERMINAL_KEY = process.env.TBANK_TERMINAL_KEY || ''
const TBANK_PASSWORD = process.env.TBANK_PASSWORD || ''
const TBANK_API_URL = process.env.TBANK_API_URL || 'https://securepay.tinkoff.ru/v2'

// For testing, use demo terminal
const TBANK_DEMO_TERMINAL_KEY = process.env.TBANK_DEMO_TERMINAL_KEY || ''
const TBANK_DEMO_PASSWORD = process.env.TBANK_DEMO_PASSWORD || ''

export interface TBankInitParams {
  Amount: number // Amount in kopecks (e.g., 10000 = 100 RUB)
  OrderId: string // Unique order ID in your system
  Description?: string // Order description (shown on payment form)
  CustomerKey?: string // Customer ID for saved cards
  Recurrent?: 'Y' // Enable card saving for recurring payments
  PayType?: 'O' | 'T' // O = one-stage, T = two-stage
  Language?: 'ru' | 'en'
  NotificationURL?: string
  SuccessURL?: string
  FailURL?: string
  RedirectDueDate?: string // Payment link expiration (YYYY-MM-DDTHH24:MI:SS+GMT)
  DATA?: Record<string, string>
  Receipt?: TBankReceipt
}

export interface TBankReceipt {
  Email?: string
  Phone?: string
  Taxation: 'osn' | 'usn_income' | 'usn_income_outcome' | 'envd' | 'esn' | 'patent'
  Items: TBankReceiptItem[]
}

export interface TBankReceiptItem {
  Name: string // Product name (max 128 chars)
  Price: number // Price in kopecks
  Quantity: number
  Amount: number // Total = Price * Quantity
  Tax: 'none' | 'vat0' | 'vat10' | 'vat20' | 'vat110' | 'vat120'
  PaymentMethod?: 'full_prepayment' | 'prepayment' | 'advance' | 'full_payment' | 'partial_payment' | 'credit' | 'credit_payment'
  PaymentObject?: 'commodity' | 'excise' | 'job' | 'service' | 'gambling_bet' | 'gambling_prize' | 'lottery' | 'lottery_prize' | 'intellectual_activity' | 'payment' | 'agent_commission' | 'composite' | 'another'
}

export interface TBankInitResponse {
  Success: boolean
  ErrorCode: string
  TerminalKey: string
  Status: string
  PaymentId: string
  OrderId: string
  Amount: number
  PaymentURL?: string
  Message?: string
  Details?: string
}

export interface TBankNotification {
  TerminalKey: string
  OrderId: string
  Success: boolean
  Status: 'AUTHORIZED' | 'CONFIRMED' | 'REVERSED' | 'REFUNDED' | 'PARTIAL_REFUNDED' | 'REJECTED'
  PaymentId: number
  ErrorCode: string
  Amount: number
  RebillId?: number
  CardId?: number
  Pan?: string
  ExpDate?: string
  Token: string
  Data?: Record<string, string>
}

export interface TBankGetStateResponse {
  Success: boolean
  ErrorCode: string
  Message?: string
  TerminalKey: string
  Status: string
  PaymentId: string
  OrderId: string
  Amount: number
}

/**
 * Generate token (signature) for T-Bank API request
 * 
 * Algorithm:
 * 1. Collect all root-level params (exclude nested objects/arrays)
 * 2. Add Password param
 * 3. Sort by key alphabetically
 * 4. Concatenate values into single string
 * 5. Apply SHA-256 hash
 */
export function generateToken(params: Record<string, unknown>, password: string): string {
  // Filter only primitive values (exclude objects and arrays)
  const filteredParams: Record<string, string> = {}
  
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && typeof value !== 'object') {
      filteredParams[key] = String(value)
    }
  }
  
  // Add password
  filteredParams['Password'] = password
  
  // Sort by key
  const sortedKeys = Object.keys(filteredParams).sort()
  
  // Concatenate values
  const concatenated = sortedKeys.map(key => filteredParams[key]).join('')
  
  // SHA-256 hash
  return crypto.createHash('sha256').update(concatenated, 'utf8').digest('hex')
}

/**
 * Verify notification token from T-Bank
 */
export function verifyNotificationToken(notification: TBankNotification, password: string): boolean {
  const { Token, ...params } = notification
  const calculatedToken = generateToken(params as Record<string, unknown>, password)
  return calculatedToken === Token
}

/**
 * Initialize payment - creates payment and returns URL for redirect
 */
export async function initPayment(
  params: TBankInitParams,
  useDemo = false
): Promise<TBankInitResponse> {
  const terminalKey = useDemo ? TBANK_DEMO_TERMINAL_KEY : TBANK_TERMINAL_KEY
  const password = useDemo ? TBANK_DEMO_PASSWORD : TBANK_PASSWORD
  
  if (!terminalKey || !password) {
    throw new Error('T-Bank credentials not configured. Set TBANK_TERMINAL_KEY and TBANK_PASSWORD in .env.local')
  }
  
  return initPaymentWithCredentials(params, terminalKey, password)
}

/**
 * Initialize payment with explicit credentials (for use with admin settings)
 */
export async function initPaymentWithCredentials(
  params: TBankInitParams,
  terminalKey: string,
  password: string
): Promise<TBankInitResponse> {
  if (!terminalKey || !password) {
    throw new Error('T-Bank credentials not provided')
  }
  
  const requestBody: Record<string, unknown> = {
    TerminalKey: terminalKey,
    ...params,
  }
  
  // Generate token
  requestBody.Token = generateToken(requestBody, password)
  
  const response = await fetch(`${TBANK_API_URL}/Init`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })
  
  const data: TBankInitResponse = await response.json()
  
  if (!data.Success) {
    console.error('T-Bank Init failed:', data)
    throw new Error(`T-Bank payment init failed: ${data.Message || data.ErrorCode}`)
  }
  
  return data
}

/**
 * Get payment status
 */
export async function getPaymentState(
  paymentId: string,
  useDemo = false
): Promise<TBankGetStateResponse> {
  const terminalKey = useDemo ? TBANK_DEMO_TERMINAL_KEY : TBANK_TERMINAL_KEY
  const password = useDemo ? TBANK_DEMO_PASSWORD : TBANK_PASSWORD
  
  const requestBody: Record<string, unknown> = {
    TerminalKey: terminalKey,
    PaymentId: paymentId,
  }
  
  requestBody.Token = generateToken(requestBody, password)
  
  const response = await fetch(`${TBANK_API_URL}/GetState`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })
  
  return response.json()
}

/**
 * Cancel payment (full refund)
 */
export async function cancelPayment(
  paymentId: string,
  useDemo = false
): Promise<{ Success: boolean; ErrorCode: string; Message?: string }> {
  const terminalKey = useDemo ? TBANK_DEMO_TERMINAL_KEY : TBANK_TERMINAL_KEY
  const password = useDemo ? TBANK_DEMO_PASSWORD : TBANK_PASSWORD
  
  const requestBody: Record<string, unknown> = {
    TerminalKey: terminalKey,
    PaymentId: paymentId,
  }
  
  requestBody.Token = generateToken(requestBody, password)
  
  const response = await fetch(`${TBANK_API_URL}/Cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })
  
  return response.json()
}

/**
 * Helper: Convert rubles to kopecks
 */
export function rublesToKopecks(rubles: number): number {
  return Math.round(rubles * 100)
}

/**
 * Helper: Convert kopecks to rubles
 */
export function kopecksToRubles(kopecks: number): number {
  return kopecks / 100
}

/**
 * Helper: Generate unique order ID
 */
export function generateOrderId(prefix = 'ORD'): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}
