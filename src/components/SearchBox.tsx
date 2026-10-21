import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { placeLabel, searchPlaces, type Place } from '../lib/geocode'
import { IconSearch } from './icons'

interface Props {
  onPick: (p: Place) => void
  placeholder?: string
}

export function SearchBox({ onPick, placeholder = 'Search a city, region, or location…' }: Props) {
  const uid = useId()
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Place[]>([])
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const timer = useRef(0)
  const ctrl = useRef<AbortController | null>(null)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.clearTimeout(timer.current)
      ctrl.current?.abort()
    }
  }, [])

  const run = (value: string) => {
    window.clearTimeout(timer.current)
    ctrl.current?.abort()
    if (value.trim().length < 2) {
      setResults([])
      setState('idle')
      return
    }
    setState('loading')
    timer.current = window.setTimeout(async () => {
      const c = new AbortController()
      ctrl.current = c
      try {
        const r = await searchPlaces(value, c.signal)
        setResults(r)
        setActive(0)
        setState('done')
      } catch {
        if (!c.signal.aborted) setState('error')
      }
    }, 280)
  }

  const choose = (p: Place) => {
    setQ(placeLabel(p))
    setOpen(false)
    onPick(p)
  }

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((a) => Math.min(a + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      if (open && results[active]) {
        e.preventDefault()
        choose(results[active])
      }
    } else if (e.key === 'Escape') setOpen(false)
  }

  const showList = open && q.trim().length >= 2
  return (
    <div className="search" ref={root}>
      <div className="search-box">
        <IconSearch />
        <input
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={`${uid}-list`}
          aria-activedescendant={showList && results[active] ? `${uid}-o${active}` : undefined}
          aria-autocomplete="list"
          aria-label="Search a city, region, or location"
          placeholder={placeholder}
          value={q}
          autoComplete="off"
          onChange={(e) => {
            setQ(e.target.value)
            setOpen(true)
            run(e.target.value)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
        />
      </div>
      {showList && (
        <div className="search-list" id={`${uid}-list`} role="listbox">
          {state === 'loading' && <div className="search-note">Searching…</div>}
          {state === 'error' && (
            <div className="search-note">
              The geocoding service couldn’t be reached. Check your connection and try again.
            </div>
          )}
          {state === 'done' && results.length === 0 && (
            <div className="search-note">No matching places found. Try a different spelling.</div>
          )}
          {state === 'done' &&
            results.map((p, i) => (
              <button
                key={p.id}
                id={`${uid}-o${i}`}
                role="option"
                aria-selected={i === active}
                className="search-opt"
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(p)}
              >
                <span>{p.name}</span>
                <small>
                  {[p.admin1, p.country].filter(Boolean).join(', ')} ·{' '}
                  <span className="num">
                    {p.lat.toFixed(2)}, {p.lon.toFixed(2)}
                  </span>
                </small>
              </button>
            ))}
        </div>
      )}
    </div>
  )
}
