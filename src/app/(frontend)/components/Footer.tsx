'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

const footerLinks = {
  about: [
    { label: 'About', href: '#about' },
    { label: 'Flavors', href: '#flavors' },
    { label: 'Contact Us', href: '#contact' },
  ],
  flavors: [
    { label: 'Contact Us', href: '#contact' },
    { label: 'Term Nlootings', href: '#terms' },
    { label: 'Contact', href: '#contact' },
  ],
}

const socialIcons = [
  {
    label: 'Facebook',
    href: '#',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: '#',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    href: '#',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
  },
  {
    label: 'YouTube',
    href: '#',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="#0a0e1a" />
      </svg>
    ),
  },
]

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__grid">
          <div className="site-footer__brand">
            <Image src="/images/logo.png" alt="ЭТРА" width={80} height={32} />
            <div className="site-footer__social">
              {socialIcons.map((s) => (
                <a key={s.label} href={s.href} className="site-footer__social-link" aria-label={s.label}>
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          <div className="site-footer__col">
            <h4 className="site-footer__heading">About</h4>
            {footerLinks.about.map((link) => (
              <a key={link.label} href={link.href} className="site-footer__link">
                {link.label}
              </a>
            ))}
          </div>

          <div className="site-footer__col">
            <h4 className="site-footer__heading">Flavors</h4>
            {footerLinks.flavors.map((link, i) => (
              <a key={i} href={link.href} className="site-footer__link">
                {link.label}
              </a>
            ))}
          </div>

          <div className="site-footer__col">
            <h4 className="site-footer__heading">Newsletter</h4>
            <p className="site-footer__text">Sign up for the newsletter, and more.</p>
            <form className="site-footer__newsletter" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Email address" className="site-footer__input" />
              <button type="submit" className="site-footer__submit">Sign up</button>
            </form>
          </div>
        </div>

        <div className="site-footer__bottom">
          <span>&copy; {new Date().getFullYear()} Etra Project | Design</span>
          <span>Sagoenter</span>
        </div>
      </div>
    </footer>
  )
}
