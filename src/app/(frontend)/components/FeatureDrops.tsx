'use client'

import React, { useState } from 'react'

const features = [
  {
    id: 1,
    title: 'Зачем вы тут?',
    content: 'Мы создаём живые напитки, которые возвращают вашему организму естественный баланс через силу ферментации.',
  },
  {
    id: 2,
    title: 'Энзимы',
    content: 'Активные ферменты расщепляют сложные молекулы, улучшая усвоение питательных веществ и ускоряя метаболизм.',
  },
  {
    id: 3,
    title: 'Бактерии',
    content: 'Миллиарды живых пробиотиков восстанавливают микрофлору кишечника и укрепляют иммунную систему.',
  },
  {
    id: 4,
    title: 'Технология',
    content: 'Многоступенчатая ферментация при контролируемой температуре сохраняет максимум полезных веществ.',
  },
  {
    id: 5,
    title: 'Результат',
    content: 'Энергия, лёгкость, здоровое пищеварение и крепкий иммунитет — всё это в каждой бутылке ЭТРА.',
  },
]

export function FeatureDrops() {
  const [activeId, setActiveId] = useState<number | null>(1)

  const handleToggle = (id: number) => {
    setActiveId(activeId === id ? null : id)
  }

  return (
    <div className="feature-drops">
      {features.map((feature, index) => {
        const isActive = activeId === feature.id

        return (
          <div
            key={feature.id}
            className={`feature-drop feature-drop--${index + 1} ${isActive ? 'feature-drop--active' : ''}`}
            onClick={() => handleToggle(feature.id)}
            onMouseEnter={() => setActiveId(feature.id)}
          >
            <h3 className="feature-drop__title">{feature.title}</h3>
            <div className="feature-drop__content">
              <p>{feature.content}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
