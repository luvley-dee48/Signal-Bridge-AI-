import { useEffect, useRef, useState } from 'react'
import { CONTACT_URL, type PageActions } from '../lib/config'
import { Brand } from './Logo'
import { IconChevron, IconClose, IconMenu } from './icons'

interface Item {
  label: string
  desc: string
  href: string
  badge?: 'live' | 'proto' | 'planned'
}

const platform: Item[] = [
  { label: 'Global Overview', desc: 'Live hazard map from public feeds', href: '#explorer', badge: 'live' },
  { label: 'Location Intelligence', desc: 'Evidence briefing for a place', href: '#briefing', badge: 'proto' },
  { label: 'Live Monitoring', desc: 'ESP32 flood-sensor dashboard', href: '#monitoring', badge: 'planned' },
  { label: 'How it works', desc: 'From evidence to action', href: '#how' },
]
const solutions: Item[] = [
  { label: 'Residents & communities', desc: 'Local environmental context', href: '#use-cases' },
  { label: 'Agriculture', desc: 'Weather & hazard context for land', href: '#use-cases' },
  { label: 'Travel & logistics', desc: 'Conditions around destinations', href: '#use-cases' },
  { label: 'Organizations', desc: 'Multi-location monitoring', href: '#use-cases' },
]

const sections = ['explorer', 'how', 'capabilities', 'methodology', 'pricing', 'partners']

function Dropdown({ label, items }: { label: string; items: Item[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        ref.current?.querySelector<HTMLButtonElement>('button')?.focus()
      }
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])
  return (
    <div className="dd" ref={ref}>
      <button
        className="nav-link"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
      >
        {label}
        <IconChevron />
      </button>
      {open && (
        <div className="dd-menu" role="menu">
          {items.map((it) => (
            <a
              key={it.label}
              role="menuitem"
              href={it.href}
              className="dd-item"
              onClick={() => setOpen(false)}
            >
              <strong>
                {it.label}
                {it.badge && <span className={`badge ${it.badge}`}>{it.badge === 'live' ? 'Live' : it.badge === 'proto' ? 'Prototype' : 'Planned'}</span>}
              </strong>
              <span className="d">{it.desc}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

export function Nav({ openAccess }: PageActions) {
  const [scrolled, setScrolled] = useState(false)
  const [mobile, setMobile] = useState(false)
  const [active, setActive] = useState('')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s)).filter(Boolean) as HTMLElement[]
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id)
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    els.forEach((e) => io.observe(e))
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobile ? 'hidden' : ''
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMobile(false)
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
    }
  }, [mobile])

  const link = (id: string, label: string) => (
    <a href={`#${id}`} className={`nav-link ${active === id ? 'active' : ''}`} aria-current={active === id ? 'location' : undefined}>
      {label}
    </a>
  )

  return (
    <>
      <div className="nav-wrap">
        <nav className={`nav ${scrolled ? 'scrolled' : ''}`} aria-label="Primary">
          <Brand />
          <div className="nav-links">
            <Dropdown label="Platform" items={platform} />
            <Dropdown label="Solutions" items={solutions} />
            {link('methodology', 'Data & Methodology')}
            {link('pricing', 'Access')}
            {link('partners', 'Partners')}
          </div>
          <div className="nav-actions">
            <button className="btn btn-sm hide-m" onClick={() => openAccess('signin')}>
              Sign in
            </button>
            <a className="btn btn-primary btn-sm" href="#explorer">
              <span className="lbl-long">Explore Intelligence</span>
              <span className="lbl-short">Explore</span>
            </a>
            <button
              className="menu-btn"
              aria-label={mobile ? 'Close menu' : 'Open menu'}
              aria-expanded={mobile}
              onClick={() => setMobile((m) => !m)}
            >
              {mobile ? <IconClose /> : <IconMenu />}
            </button>
          </div>
        </nav>
      </div>
      {mobile && (
        <div className="mobile-menu" role="dialog" aria-label="Menu">
          <span className="m-group">Platform</span>
          {platform.map((i) => (
            <a key={i.label} href={i.href} onClick={() => setMobile(false)}>
              {i.label}
            </a>
          ))}
          <span className="m-group">Company</span>
          <a href="#use-cases" onClick={() => setMobile(false)}>Solutions</a>
          <a href="#methodology" onClick={() => setMobile(false)}>Data &amp; Methodology</a>
          <a href="#pricing" onClick={() => setMobile(false)}>Access &amp; Pricing</a>
          <a href="#partners" onClick={() => setMobile(false)}>Partners</a>
          <a href={CONTACT_URL} target="_blank" rel="noreferrer">Contact</a>
          <button
            className="btn"
            onClick={() => {
              setMobile(false)
              openAccess('signin')
            }}
          >
            Sign in
          </button>
        </div>
      )}
    </>
  )
}
