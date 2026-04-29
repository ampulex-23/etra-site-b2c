'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Share2, Copy, Check, X } from 'lucide-react'

interface ShareButtonProps {
  productSlug: string
  productName: string
  productImage?: string
  className?: string
}

interface ShareSettings {
  enabled: boolean
  shareTitle: string
  shareText: string
  enabledSources: string[]
  commissionFirstPurchase?: number
  customerDiscountFirstPurchase?: number
}

interface PartnerInfo {
  promoCode: string
  balance: number
}

export function ShareButton({ productSlug, productName, productImage: _productImage, className = '' }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [settings, setSettings] = useState<ShareSettings | null>(null)
  const [partner, setPartner] = useState<PartnerInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Required for SSR-safety with portals: only render on the client.
  useEffect(() => {
    setMounted(true)
  }, [])

  // Lock body scroll while the share modal is open. Using a portal alone
  // does not prevent the underlying page from scrolling under the overlay.
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  useEffect(() => {
    async function fetchData() {
      try {
        const settingsRes = await fetch('/api/referral/settings')
        if (settingsRes.ok) {
          const data = await settingsRes.json()
          setSettings(data)
        }

        const token = typeof window !== 'undefined' ? localStorage.getItem('etra-customer-token') : null
        if (token) {
          const meRes = await fetch('/api/referral/me', {
            headers: { Authorization: `JWT ${token}` },
          })
          if (meRes.ok) {
            const data = await meRes.json()
            if (data.partner) {
              setPartner({
                promoCode: data.partner.promoCode,
                balance: data.partner.balance || 0,
              })
            }
          }
        }
      } catch (error) {
        console.error('Error fetching share data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading || !settings?.enabled || !partner) {
    return null
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const referralUrl = `${baseUrl}/api/referral/track?ref=${partner.promoCode}&source=share&redirect=/products/${productSlug}`
  const shareText = (settings.shareText || 'Рекомендую ЭТРА 🌿').replace('{product}', productName)

  const shareLinks = {
    telegram: `https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent(shareText)}`,
    vk: `https://vk.com/share.php?url=${encodeURIComponent(referralUrl)}&title=${encodeURIComponent(shareText)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + referralUrl)}`,
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleShare = (source: string) => {
    if (source === 'copy') {
      handleCopy()
      return
    }

    const url = shareLinks[source as keyof typeof shareLinks]
    if (url) {
      window.open(url, '_blank', 'width=600,height=400')
    }
    setIsOpen(false)
  }

  const sourceIcons: Record<string, React.ReactNode> = {
    telegram: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="share-icon">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
    vk: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="share-icon">
        <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4 8.57 4 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.678.847 2.49 2.27 4.675 2.853 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z"/>
      </svg>
    ),
    whatsapp: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="share-icon">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
    copy: copied ? <Check size={20} /> : <Copy size={20} />,
  }

  const sourceLabels: Record<string, string> = {
    telegram: 'Telegram',
    vk: 'ВКонтакте',
    whatsapp: 'WhatsApp',
    copy: copied ? 'Скопировано!' : 'Копировать',
  }

  return (
    <>
      <button
        type="button"
        className={`share-btn ${className}`}
        onClick={() => setIsOpen(true)}
        aria-label="Поделиться"
        title="Поделиться"
      >
        <Share2 size={20} />
      </button>

      {/* Render via portal so the modal is not clipped by ancestors that
          create a containing block (e.g. `.glass` with `backdrop-filter`,
          or any `transform`/`filter`/`contain` on a parent). */}
      {isOpen && mounted && createPortal(
        <div className="share-modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <div className="share-modal__header">
              <h3>Поделиться товаром</h3>
              <button 
                type="button" 
                className="share-modal__close"
                onClick={() => setIsOpen(false)}
              >
                <X size={24} />
              </button>
            </div>

            <div className="share-modal__content">
              <p className="share-modal__product">{productName}</p>
              
              <div className="share-modal__sources">
                {settings.enabledSources.map((source) => (
                  <button
                    key={source}
                    type="button"
                    className={`share-source share-source--${source}`}
                    onClick={() => handleShare(source)}
                  >
                    {sourceIcons[source]}
                    <span>{sourceLabels[source]}</span>
                  </button>
                ))}
              </div>

              <div className="share-modal__link">
                <input
                  type="text"
                  value={referralUrl}
                  readOnly
                  className="share-modal__input"
                />
                <button
                  type="button"
                  className="share-modal__copy"
                  onClick={handleCopy}
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>

              <div className="share-modal__info">
                <p>
                  Ваш промокод: <strong>{partner.promoCode}</strong>
                </p>
                <p>
                  Ваш баланс: <strong>{partner.balance.toLocaleString('ru-RU')} ₽</strong>
                </p>
                <p className="share-modal__info-desc">
                  Друг получит скидку {settings.customerDiscountFirstPurchase || 10}% на первую покупку,
                  а вам начислится {settings.commissionFirstPurchase || 10}% с его заказа.
                </p>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}

      <style jsx>{`
        :where(.share-btn) {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: var(--color-primary, #4A7C59);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: background 0.2s;
        }
        :where(.share-btn:hover) {
          background: var(--color-primary-dark, #3d6649);
        }

        .share-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .share-modal {
          background: white;
          border-radius: 16px;
          width: 100%;
          max-width: 400px;
          overflow: hidden;
        }

        .share-modal__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid #eee;
        }

        .share-modal__header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .share-modal__close {
          background: none;
          border: none;
          cursor: pointer;
          color: #666;
          padding: 4px;
        }

        .share-modal__content {
          padding: 20px;
        }

        .share-modal__product {
          font-weight: 500;
          margin: 0 0 20px;
          color: #333;
        }

        .share-modal__sources {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }

        .share-source {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border: 1px solid #e0e0e0;
          border-radius: 10px;
          background: white;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .share-source:hover {
          border-color: #ccc;
          background: #f9f9f9;
        }

        .share-source--telegram:hover {
          border-color: #0088cc;
          color: #0088cc;
        }

        .share-source--vk:hover {
          border-color: #4a76a8;
          color: #4a76a8;
        }

        .share-source--whatsapp:hover {
          border-color: #25d366;
          color: #25d366;
        }

        :global(.share-icon) {
          width: 20px;
          height: 20px;
        }

        .share-modal__link {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }

        .share-modal__input {
          flex: 1;
          padding: 10px 12px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          font-size: 13px;
          color: #666;
          background: #f9f9f9;
        }

        .share-modal__copy {
          padding: 10px 14px;
          background: var(--color-primary, #4A7C59);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }

        .share-modal__info {
          background: #f5f5f5;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 13px;
        }

        .share-modal__info p {
          margin: 4px 0;
          color: #666;
        }

        .share-modal__info strong {
          color: #333;
        }
      `}</style>
    </>
  )
}
