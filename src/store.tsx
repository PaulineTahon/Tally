import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Check } from 'lucide-react'
import { DEFAULT_STYLE, type QrFormat, type QrStyle } from './qr'
import { tick } from './guide'
import { DIRECT, MAIN_QR, SEED, ZERO, type Counts } from './seed'

export const FORM_ID = 'QoKz0A'
export const FORM_TITLE = 'Community picnic RSVP'
export const EASTER_EGG = 'https://tally.so/r/KpYalV?ref=qr'

export interface Source {
  ref: string
  label: string
  kind: 'qr' | 'social' | 'email' | 'custom'
  responses: number
  /** Visits and responses per range, for Insights. */
  counts: Counts
}

export { MAIN_QR }

/** Example numbers only, from the one shared seed. */
export const EXAMPLE_SOURCES: Source[] = SEED.map((p) => ({ ref: p.ref, label: p.label, kind: p.kind, responses: p.counts.all[1], counts: p.counts }))

/** Last QR settings, so the next download looks the same. */
export interface QrSettings { style: QrStyle; format: QrFormat }
const SETTINGS_KEY = 'qr-settings'
function loadSettings(): QrSettings {
  const base: QrSettings = { style: DEFAULT_STYLE, format: 'svg' }
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return base
    const v = JSON.parse(raw)
    return { style: { ...DEFAULT_STYLE, ...v.style }, format: v.format ?? 'svg' }
  } catch { return base }
}
export const EXAMPLE_UNTAGGED = DIRECT.all[1]

export interface ToastAction { label: string; onClick: () => void }
export interface ToastOptions { action?: ToastAction; duration?: number }
interface Toast { id: number; text: string; leaving?: boolean; action?: ToastAction; duration: number }

interface Store {
  slug: string
  setSlug: (s: string) => void
  /** Endings this form used before. They keep redirecting and stay reserved for this form. */
  oldEndings: string[]
  removeEnding: (e: string) => void
  shortLink: string
  url: (ref?: string) => string
  display: (ref?: string) => string
  downloadedLink: string | null
  markDownloaded: () => void
  sources: Source[]
  addSource: (label: string) => Source
  toast: (text: string, opts?: ToastOptions) => void
  qrOpen: boolean
  setQrOpen: (v: boolean) => void
  placements: Source[]
  addPlacement: (label: string) => Source
  renameSource: (ref: string, label: string) => void
  removeSource: (ref: string) => void
  settings: QrSettings
  setSettings: (s: QrSettings) => void
  qrRef: string
  setQrRef: (r: string) => void
}

const Ctx = createContext<Store | null>(null)
export const useStore = () => useContext(Ctx)!

export function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [slug, setSlugState] = useState(FORM_ID)
  const [oldEndings, setOldEndings] = useState<string[]>([])
  const setSlug = useCallback((next: string) => {
    setSlugState((cur) => {
      if (next === cur) return cur
      // The form ID always works, so it never needs listing.
      setOldEndings((o) => [...o.filter((e) => e !== next && e !== cur), ...(cur === FORM_ID ? [] : [cur])])
      return next
    })
  }, [])
  const removeEnding = useCallback((e: string) => setOldEndings((o) => o.filter((x) => x !== e)), [])
  const [downloadedLink, setDownloaded] = useState<string | null>(null)
  const [sources, setSources] = useState<Source[]>(EXAMPLE_SOURCES)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [qrOpen, setQrOpen] = useState(false)
  const [settings, setSettingsState] = useState<QrSettings>(loadSettings)
  const setSettings = useCallback((v: QrSettings) => {
    setSettingsState(v)
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(v)) } catch { /* private mode */ }
  }, [])
  const [qrRef, setQrRef] = useState('qr')
  const nextId = useRef(1)

  /** Toasts stack, up to three. Each one times itself (pausing while hovered or focused), leaves the way it came in, then unmounts. */
  const leave = useCallback((lid: number) => {
    setToasts((t) => t.map((x) => (x.id === lid ? { ...x, leaving: true } : x)))
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== lid)), 200)
  }, [])
  const toast = useCallback((text: string, opts: ToastOptions = {}) => {
    const id = nextId.current++
    const duration = opts.duration ?? (opts.action ? 6000 : 2600)
    setToasts((t) => {
      const live = t.filter((x) => !x.leaving)
      if (live.length >= 3) setTimeout(() => leave(live[0].id))
      return [...t, { id, text, action: opts.action, duration }]
    })
    // In a bottom sheet, keep the field you just used clear of the toast.
    requestAnimationFrame(() => {
      const el = document.activeElement
      if (el instanceof HTMLElement && el.closest('.sheet-body')) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    })
  }, [leave])

  const shortLink = `tally.so/r/${slug}`
  const url = useCallback((ref?: string) => `https://tally.so/r/${slug}${ref ? `?ref=${ref}` : ''}`, [slug])
  const display = useCallback((ref?: string) => `tally.so/r/${slug}${ref ? `?ref=${ref}` : ''}`, [slug])

  const addSource = useCallback((label: string) => {
    const ref = slugify(label) || 'link'
    const existing = sources.find((s) => s.ref === ref)
    if (existing) return existing
    const s: Source = { ref, label: label.trim() || ref, kind: 'custom', responses: 0, counts: ZERO }
    setSources((all) => [...all, s])
    return s
  }, [sources])

  /** Extra codes get qr-<place>, made unique once and never changed, so printed copies keep their tag. */
  const addPlacement = useCallback((label: string) => {
    tick('add-code')
    const name = label.trim()
    const same = sources.find((s) => s.kind === 'qr' && s.label.toLowerCase() === name.toLowerCase())
    if (same) return same
    const base = `qr-${slugify(name) || 'code'}`
    let ref = base
    for (let i = 2; sources.some((s) => s.ref === ref); i++) ref = `${base}-${i}`
    const s: Source = { ref, label: name, kind: 'qr', responses: 0, counts: ZERO }
    setSources((all) => [...all, s])
    return s
  }, [sources])
  /** Renaming only changes what you see. The ref, and so the link, stays the same. */
  const renameSource = useCallback((ref: string, label: string) => {
    tick('rename')
    setSources((all) => all.map((s) => (s.ref === ref ? { ...s, label: label.trim() || s.label } : s)))
  }, [])
  const removeSource = useCallback((ref: string) => {
    if (ref === MAIN_QR) return
    setSources((all) => all.filter((s) => s.ref !== ref))
  }, [])
  /** The main code first, then the others in the order they were made. */
  const placements = useMemo(() => {
    const qr = sources.filter((s) => s.kind === 'qr')
    return [...qr.filter((s) => s.ref === MAIN_QR), ...qr.filter((s) => s.ref !== MAIN_QR)]
  }, [sources])

  const value = useMemo<Store>(() => ({
    slug, setSlug, oldEndings, removeEnding, shortLink, url, display,
    downloadedLink, markDownloaded: () => setDownloaded(`tally.so/r/${slug}`),
    sources, addSource, toast, qrOpen, setQrOpen, qrRef, setQrRef, placements, addPlacement, renameSource, removeSource, settings, setSettings,
  }), [slug, setSlug, oldEndings, removeEnding, shortLink, url, display, downloadedLink, sources, addSource, toast, qrOpen, qrRef, placements, addPlacement, renameSource, removeSource, settings, setSettings])

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="toast-wrap" aria-live="polite" role="status">
        <ol className="toast-stack">
          {toasts.map((t) => {
            const live = toasts.filter((x) => !x.leaving)
            const depth = t.leaving ? 0 : live.length - 1 - live.indexOf(t)
            return <ToastItem key={t.id} t={t} depth={depth} onDone={() => leave(t.id)} />
          })}
        </ol>
      </div>
    </Ctx.Provider>
  )
}

/** Enters from below via a mounted flag, so it is a transition and can be retargeted mid-way. */
function ToastItem({ t, depth, onDone }: { t: Toast; depth: number; onDone: () => void }) {
  const [mounted, setMounted] = useState(false)
  const [paused, setPaused] = useState(false)
  const left = useRef(t.duration)
  const leaving = !!t.leaving
  useEffect(() => { const r = requestAnimationFrame(() => setMounted(true)); return () => cancelAnimationFrame(r) }, [])
  // Counts down only while nobody is reading or using it.
  useEffect(() => {
    if (paused || leaving) return
    const start = performance.now()
    const timer = window.setTimeout(onDone, left.current)
    return () => { window.clearTimeout(timer); left.current -= performance.now() - start }
  }, [paused, leaving]) // eslint-disable-line react-hooks/exhaustive-deps
  const hold = () => setPaused(true)
  const go = () => setPaused(false)
  return (
    <li className={`toast-item ${t.action ? 'has-action' : ''}`} data-mounted={mounted} data-leaving={leaving} data-front={depth === 0}
      onMouseEnter={hold} onMouseLeave={go} onFocus={hold} onBlur={go}
      style={{ transform: mounted && !leaving ? `translateY(${-depth * 10}px) scale(${1 - depth * 0.05})` : undefined, zIndex: 10 - depth }}>
      <div className="toast"><Check aria-hidden />{t.text}
        {t.action && <button type="button" className="toast-action" onClick={() => { t.action!.onClick(); onDone() }}>{t.action.label}</button>}
      </div>
    </li>
  )
}

export function useIsMobile() {
  const q = '(max-width: 757px)'
  const [m, setM] = useState(() => window.matchMedia(q).matches)
  useEffect(() => {
    const mq = window.matchMedia(q)
    const on = () => setM(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return m
}

export function useReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    let ok = false
    try { ok = document.execCommand('copy') } catch { ok = false }
    ta.remove()
    return ok
  }
}

export const canNativeShare = () => typeof navigator !== 'undefined' && typeof navigator.share === 'function'
