import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Check } from 'lucide-react'
import { DEFAULT_STYLE, type QrFormat, type QrSize, type QrStyle } from './qr'

export const FORM_ID = 'QoKz0A'
export const FORM_TITLE = 'Community picnic RSVP'
export const EASTER_EGG = 'https://tally.so/r/KpYalV?ref=qr'

export interface Source {
  ref: string
  label: string
  kind: 'qr' | 'social' | 'email' | 'custom'
  responses: number
}

/** Example numbers only, shown with an "Example data" label in the UI. */
export const EXAMPLE_SOURCES: Source[] = [
  { ref: 'whatsapp', label: 'WhatsApp', kind: 'social', responses: 4 },
  { ref: 'qr-poster', label: 'Poster', kind: 'qr', responses: 3 },
  { ref: 'email', label: 'Email', kind: 'email', responses: 2 },
  { ref: 'qr-flyer', label: 'Flyer', kind: 'qr', responses: 1 },
  { ref: 'instagram', label: 'Instagram', kind: 'social', responses: 1 },
]

/** Last QR settings, so the next download looks the same. */
export interface QrSettings { style: QrStyle; format: QrFormat; size: QrSize }
const SETTINGS_KEY = 'qr-settings'
function loadSettings(): QrSettings {
  const base: QrSettings = { style: DEFAULT_STYLE, format: 'svg', size: 'medium' }
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return base
    const v = JSON.parse(raw)
    return { style: { ...DEFAULT_STYLE, ...v.style }, format: v.format ?? 'svg', size: v.size ?? 'medium' }
  } catch { return base }
}
export const EXAMPLE_UNTAGGED = 1

interface Toast { id: number; text: string; leaving?: boolean }

interface Store {
  slug: string
  setSlug: (s: string) => void
  shortLink: string
  url: (ref?: string) => string
  display: (ref?: string) => string
  downloadedLink: string | null
  markDownloaded: () => void
  sources: Source[]
  addSource: (label: string) => Source
  toast: (text: string) => void
  qrOpen: boolean
  setQrOpen: (v: boolean) => void
  placements: Source[]
  addPlacement: (label: string) => Source
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
  const [slug, setSlug] = useState(FORM_ID)
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

  /** Toasts stack, up to three. Each one leaves the way it came in, then unmounts. */
  const toast = useCallback((text: string) => {
    const id = nextId.current++
    const leave = (lid: number) => {
      setToasts((t) => t.map((x) => (x.id === lid ? { ...x, leaving: true } : x)))
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== lid)), 200)
    }
    setToasts((t) => {
      const live = t.filter((x) => !x.leaving)
      if (live.length >= 3) setTimeout(() => leave(live[0].id))
      return [...t, { id, text }]
    })
    setTimeout(() => leave(id), 2600)
  }, [])

  const shortLink = `tally.so/r/${slug}`
  const url = useCallback((ref?: string) => `https://tally.so/r/${slug}${ref ? `?ref=${ref}` : ''}`, [slug])
  const display = useCallback((ref?: string) => `tally.so/r/${slug}${ref ? `?ref=${ref}` : ''}`, [slug])

  const addSource = useCallback((label: string) => {
    const ref = slugify(label) || 'link'
    const existing = sources.find((s) => s.ref === ref)
    if (existing) return existing
    const s: Source = { ref, label: label.trim() || ref, kind: 'custom', responses: 0 }
    setSources((all) => [...all, s])
    return s
  }, [sources])

  const addPlacement = useCallback((label: string) => {
    const ref = `qr-${slugify(label) || 'code'}`
    const existing = sources.find((s) => s.ref === ref)
    if (existing) return existing
    const s: Source = { ref, label: label.trim(), kind: 'qr', responses: 0 }
    setSources((all) => [...all, s])
    return s
  }, [sources])
  const placements = useMemo(() => sources.filter((s) => s.kind === 'qr'), [sources])

  const value = useMemo<Store>(() => ({
    slug, setSlug, shortLink, url, display,
    downloadedLink, markDownloaded: () => setDownloaded(`tally.so/r/${slug}`),
    sources, addSource, toast, qrOpen, setQrOpen, qrRef, setQrRef, placements, addPlacement, settings, setSettings,
  }), [slug, shortLink, url, display, downloadedLink, sources, addSource, toast, qrOpen, qrRef, placements, addPlacement, settings, setSettings])

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="toast-wrap" aria-live="polite" role="status">
        <ol className="toast-stack">
          {toasts.map((t) => {
            const live = toasts.filter((x) => !x.leaving)
            const depth = t.leaving ? 0 : live.length - 1 - live.indexOf(t)
            return <ToastItem key={t.id} text={t.text} depth={depth} leaving={!!t.leaving} />
          })}
        </ol>
      </div>
    </Ctx.Provider>
  )
}

/** Enters from below via a mounted flag, so it is a transition and can be retargeted mid-way. */
function ToastItem({ text, depth, leaving }: { text: string; depth: number; leaving: boolean }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const r = requestAnimationFrame(() => setMounted(true)); return () => cancelAnimationFrame(r) }, [])
  return (
    <li className="toast-item" data-mounted={mounted} data-leaving={leaving} data-front={depth === 0}
      style={{ transform: mounted && !leaving ? `translateY(${-depth * 10}px) scale(${1 - depth * 0.05})` : undefined, zIndex: 10 - depth }}>
      <div className="toast"><Check aria-hidden />{text}</div>
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
