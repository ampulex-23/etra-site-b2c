'use client'

import React from 'react'

export function JoinSection() {
  return (
    <section className="section section-join" id="join">
      <div className="container">
        <div className="section-join__glow" />
        <div className="section-join__wrapper reveal">
          <div className="section__label" style={{ justifyContent: 'center' }}>Join the Movement</div>
          <h2 className="section-join__title">
            Ready to Feel<br />the Difference?
          </h2>
          <p className="section-join__desc">
            Subscribe for exclusive offers, new flavor launches, and wellness tips
            from our enzyme scientists.
          </p>
          <form className="section-join__form" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Your email address"
              className="section-join__input"
              required
            />
            <button type="submit" className="section-join__btn">
              Subscribe
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
