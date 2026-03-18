'use client'

import React, { useEffect, useRef, useCallback } from 'react'
import { useAllFormFields, useForm } from '@payloadcms/ui'

type Variant = { name: string; price: number; sku?: string }
type ProductCache = { price: number; variants: Variant[] }

const productCache = new Map<string, ProductCache>()

async function fetchProduct(productId: string): Promise<ProductCache | null> {
  if (productCache.has(productId)) return productCache.get(productId)!
  try {
    const res = await fetch(`/api/products/${productId}?depth=0`)
    if (!res.ok) return null
    const data = await res.json()
    const entry: ProductCache = { price: data.price, variants: data.variants || [] }
    productCache.set(productId, entry)
    return entry
  } catch {
    return null
  }
}

const OrderItemFields: React.FC = () => {
  const [fields, dispatchFields] = useAllFormFields()
  const { getData } = useForm()
  const processingRef = useRef(false)
  const prevSignatureRef = useRef('')

  const buildSignature = useCallback(() => {
    const parts: string[] = []
    let i = 0
    while (fields[`items.${i}.product`]) {
      const productField = fields[`items.${i}.product`]
      const variantField = fields[`items.${i}.variantName`]
      const qtyField = fields[`items.${i}.quantity`]
      const pid = productField?.value || ''
      const vn = variantField?.value || ''
      const qty = qtyField?.value || 1
      parts.push(`${pid}|${vn}|${qty}`)
      i++
    }
    const discountField = fields['discount']
    const deliveryField = fields['deliveryCost']
    parts.push(`d:${discountField?.value || 0}`)
    parts.push(`dc:${deliveryField?.value || 0}`)
    return parts.join(';')
  }, [fields])

  useEffect(() => {
    const signature = buildSignature()
    if (signature === prevSignatureRef.current) return
    if (processingRef.current) return

    prevSignatureRef.current = signature
    processingRef.current = true

    const process = async () => {
      try {
        const formData = getData()
        const items = formData.items as Array<{
          product?: string | { id: string }
          variantName?: string
          quantity?: number
          price?: number
        }> | undefined

        if (!items || items.length === 0) {
          const discount = Number(formData.discount) || 0
          const deliveryCost = Number(formData.deliveryCost) || 0
          dispatchFields({ type: 'UPDATE', path: 'subtotal', value: 0 })
          dispatchFields({ type: 'UPDATE', path: 'total', value: Math.max(0, deliveryCost - discount) })
          return
        }

        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          const productId = typeof item.product === 'object' ? item.product?.id : item.product
          if (!productId) continue

          const product = await fetchProduct(String(productId))
          if (!product) continue

          const variants = product.variants || []
          let newPrice = product.price
          let newVariant = item.variantName

          if (variants.length === 0) {
            newVariant = ''
          } else if (variants.length === 1) {
            newVariant = variants[0].name
            newPrice = variants[0].price
          } else if (newVariant && variants.length > 1) {
            const match = variants.find((v) => v.name === newVariant)
            if (match) {
              newPrice = match.price
            } else {
              newVariant = variants[0].name
              newPrice = variants[0].price
            }
          } else if (variants.length > 1) {
            newVariant = variants[0].name
            newPrice = variants[0].price
          }

          if (item.variantName !== newVariant) {
            dispatchFields({ type: 'UPDATE', path: `items.${i}.variantName`, value: newVariant || '' })
          }
          if (item.price !== newPrice) {
            dispatchFields({ type: 'UPDATE', path: `items.${i}.price`, value: newPrice })
          }
          items[i] = { ...item, price: newPrice, quantity: item.quantity || 1 }
        }

        const subtotal = items.reduce((sum, it) => sum + (it.price || 0) * (it.quantity || 1), 0)
        const discount = Number(formData.discount) || 0
        const deliveryCost = Number(formData.deliveryCost) || 0
        const total = Math.max(0, subtotal - discount + deliveryCost)

        dispatchFields({ type: 'UPDATE', path: 'subtotal', value: subtotal })
        dispatchFields({ type: 'UPDATE', path: 'total', value: total })
      } finally {
        processingRef.current = false
      }
    }

    process()
  }, [buildSignature, getData, dispatchFields])

  return null
}

export default OrderItemFields
