'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { ChevronUp, ChevronDown } from 'lucide-react'

export function GetStarted() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <section className="get-started-section">
      <div className={`get-started ${isExpanded ? 'get-started--expanded' : ''}`}>
        {/* Collapsed state */}
        {!isExpanded && (
          <div className="get-started__collapsed" onClick={() => setIsExpanded(true)}>
            <div className="get-started__header">
              <h2 className="get-started__title">
                С ЧЕГО<br />НАЧАТЬ
              </h2>
            </div>
            <div className="get-started__image">
              <Image
                src="/images/biom.png"
                alt="Биом"
                width={120}
                height={120}
                priority
              />
            </div>
          </div>
        )}

        {/* Expanded state */}
        {isExpanded && (
          <div className="get-started__expanded">
            <button 
              className="get-started__close"
              onClick={() => setIsExpanded(false)}
              aria-label="Свернуть"
            >
              <ChevronUp size={24} />
            </button>

            <h2 className="get-started__title-expanded">С ЧЕГО НАЧАТЬ</h2>
            
            <div className="get-started__content">
              <p className="get-started__text">
                <strong>Стабильность</strong><br />
                Чистим, Наполняем, Закрепляем,<br />
                6 - 12 литров энзимных напитков в месяц, на человека.
              </p>

              <button className="get-started__btn get-started__btn--primary">
                ПОСМОТРЕТЬ ВИДЕО
              </button>

              <button className="get-started__btn get-started__btn--secondary">
                ПРОЙТИ ТЕСТ
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
