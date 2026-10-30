import { useEffect, useRef, useState } from 'react'
import { Check, X, ArrowUpRight } from 'lucide-react'
import { guideCopy, type GuidePage } from './guideCopy'
import './guide.css'

/* Prototype chrome only: a small card with things to try on each screen. */

const TRIED_KEY = 'guide-tried'
const HIDDEN_KEY = 'guide-hidden'
const EVENT = 'guide-change'

function read(key: string): string[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
}
function write(key: string, v: string[]) {
  try { localStorage.setItem(key, JSON.stringify(v)) } catch { /* private mode */ }
  window.dispatchEvent(new Event(EVENT))
}

/** Marks a Try item as done. Safe to call from anywhere, any number of times. */
export function tick(id: string) {
  const t = read(TRIED_KEY)
  if (!t.includes(id)) write(TRIED_KEY, [...t, id])
}

export function useGuide(page: GuidePage) {
  const [, force] = useState(0)
  useEffect(() => {
    const on = () => force((n) => n + 1)
    window.addEventListener(EVENT, on)
    window.addEventListener('storage', on)
    return () => { window.removeEventListener(EVENT, on); window.removeEventListener('storage', on) }
  }, [])
  const tried = read(TRIED_KEY)
  const items = guideCopy.pages[page].items
  const done = items.filter((i) => tried.includes(i.id)).length
  return {
    hidden: read(HIDDEN_KEY).includes(page),
    hide: () => write(HIDDEN_KEY, [...read(HIDDEN_KEY).filter((p) => p !== page), page]),
    show: () => write(HIDDEN_KEY, read(HIDDEN_KEY).filter((p) => p !== page)),
    tried, done, total: items.length, left: items.length - done,
  }
}

/** Keeps the card mounted for its exit animation. */
function usePresence(open: boolean, ms = 150) {
  const [mounted, setMounted] = useState(open)
  const [leaving, setLeaving] = useState(false)
  useEffect(() => {
    if (open) { setMounted(true); setLeaving(false); return }
    if (!mounted) return
    setLeaving(true)
    const t = window.setTimeout(() => { setMounted(false); setLeaving(false) }, ms)
    return () => window.clearTimeout(t)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  return { mounted, leaving }
}

export function GuideCard({ page, open, onClose, mobile = false, delay = true }: {
  page: GuidePage; open: boolean; onClose: () => void; mobile?: boolean; delay?: boolean
}) {
  const g = useGuide(page)
  const { mounted, leaving } = usePresence(open)
  const first = useRef(delay)
  useEffect(() => { if (open) { const t = window.setTimeout(() => { first.current = false }, 700); return () => window.clearTimeout(t) } }, [open])
  if (!mounted) return null
  const p = guideCopy.pages[page]
  return (
    <aside role="complementary" aria-label="Prototype guide"
      className={`guide ${mobile ? 'is-mobile' : ''} ${leaving ? 'is-leaving' : ''} ${first.current ? 'is-delayed' : ''}`}>
      <div className="guide-head">
        <span className="guide-label">{guideCopy.label}</span>
        <button type="button" className="guide-x" aria-label={guideCopy.dismiss} onClick={onClose}><X aria-hidden /></button>
      </div>
      <h2 className="guide-title">{p.title}</h2>
      <ul className="guide-items">
        {p.items.map((i) => {
          const on = g.tried.includes(i.id)
          return (
            <li key={i.id} className={on ? 'is-done' : undefined}>
              <span className="guide-tick" aria-hidden>{on && <Check />}</span>
              <span>{i.text}<span className="sr-only">{on ? ' (tried)' : ''}</span></span>
            </li>
          )
        })}
      </ul>
      <div className="guide-foot">
        <span aria-live="polite">{guideCopy.counter(g.done, g.total)}</span>
        <a href={guideCopy.caseStudyUrl} target="_blank" rel="noreferrer">{guideCopy.caseStudy}<ArrowUpRight aria-hidden /></a>
      </div>
    </aside>
  )
}
