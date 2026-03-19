'use client'

import React from 'react'

export function RecipesScreen() {
  return (
    <div className="pwa-screen animate-in">
      <div className="recipes-stub">
        <div className="recipes-stub__icon">🧪</div>
        <h1 className="t-h2" style={{ marginBottom: 10 }}>Рецепты</h1>
        <p className="t-body t-sec" style={{ maxWidth: 280, margin: '0 auto 24px' }}>
          Скоро здесь появятся рецепты приготовления ферментированных напитков и блюд с использованием нашей продукции.
        </p>
        <div className="glass" style={{ padding: 20, maxWidth: 320, margin: '0 auto' }}>
          <div className="t-h3" style={{ marginBottom: 8 }}>Следите за обновлениями</div>
          <p className="t-caption t-sec">
            Мы работаем над коллекцией авторских рецептов от шеф-поваров и нутрициологов.
          </p>
        </div>
      </div>
    </div>
  )
}
