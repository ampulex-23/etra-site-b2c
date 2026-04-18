'use client'

import { useState, useEffect, useCallback } from 'react'

interface NetworkNode {
  id: string | number
  promoCode: string
  customerName: string
  type: string
  status: string
  joinedAt: string | null
  totalEarnedFromThem: number
  children: NetworkNode[]
}

export function PartnerNetwork({ token }: { token: string }) {
  const [data, setData] = useState<{ network: NetworkNode[]; counts: any } | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/referral/me/network', {
        headers: { Authorization: `JWT ${token}` },
      })
      if (res.ok) {
        setData(await res.json())
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) return <div>Загрузка...</div>
  if (!data) return <div>Ошибка загрузки</div>

  return (
    <div>
      {/* Счётчики */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <Counter label="1-й уровень" value={data.counts.level1} color="#10b981" />
        <Counter label="2-й уровень" value={data.counts.level2} color="#0369a1" />
        <Counter label="3-й уровень" value={data.counts.level3} color="#7c3aed" />
      </div>

      {/* Дерево */}
      {data.network.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, background: '#f9fafb', borderRadius: 8 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🌱</div>
          <p style={{ color: '#6b7280' }}>У вас пока нет приглашённых партнёров</p>
          <p style={{ color: '#9ca3af', fontSize: 13 }}>Выпустите инвайт-код и поделитесь с друзьями</p>
        </div>
      ) : (
        <div>
          <h3 style={{ fontSize: 15, marginBottom: 12 }}>Моя команда</h3>
          <div>
            {data.network.map((node) => (
              <NetworkNodeCard key={node.id} node={node} level={1} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function NetworkNodeCard({ node, level }: { node: NetworkNode; level: number }) {
  const [expanded, setExpanded] = useState(level === 1)

  const bgColor = level === 1 ? '#ecfdf5' : level === 2 ? '#eff6ff' : '#f5f3ff'

  return (
    <div style={{ marginBottom: 8, paddingLeft: (level - 1) * 16 }}>
      <div
        style={{
          padding: 12,
          background: bgColor,
          borderRadius: 8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: node.children.length > 0 ? 'pointer' : 'default',
        }}
        onClick={() => node.children.length > 0 && setExpanded(!expanded)}
      >
        <div>
          <div style={{ fontWeight: 600 }}>
            {node.children.length > 0 && <span style={{ marginRight: 6 }}>{expanded ? '▼' : '▶'}</span>}
            {node.customerName}
            <span style={{ marginLeft: 8, padding: '2px 6px', background: '#fff', borderRadius: 4, fontSize: 11, color: '#6b7280' }}>
              Ур. {level}
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
            {node.promoCode} • {node.status === 'active' ? '🟢 Активен' : '🟡 ' + node.status}
            {node.children.length > 0 && <span> • подкоманда: {node.children.length}</span>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#059669' }}>
            {node.totalEarnedFromThem.toLocaleString('ru-RU')} ₽
          </div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>заработано</div>
        </div>
      </div>
      {expanded && node.children.map((child) => (
        <NetworkNodeCard key={child.id} node={child} level={level + 1} />
      ))}
    </div>
  )
}

function Counter({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ padding: 16, background: '#f9fafb', borderRadius: 8, textAlign: 'center' }}>
      <div style={{ fontSize: 12, color: '#6b7280' }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
    </div>
  )
}
