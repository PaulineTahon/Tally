import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Check } from 'lucide-react'

export const FORM_ID = 'QoKz0A'
export const FORM_TITLE = 'Community picnic RSVP'
export const EASTER_EGG = 'https://tally.so/r/KpYalV?ref=qr'

export interface Source {
  ref: string
  label: string
  kind: 'qr' | 'social' | 'email' | 'place' | 'custom'
  responses: number
}

/** Example numbers only, shown with an "Example data" label in the UI. */
export const EXAMPLE_SOURCES: Source[] = [
  { ref: 'whatsapp', label: 'WhatsApp', kind: 'social', responses: 4 },
  { ref: 'qr', label: 'QR code', kind: 'qr', responses: 3 },
  { ref: 'email', label: 'Email', kind: 'email', responses: 2 },
  { ref: 'instagram', label: 'Instagram', kind: 'social', responses: 1 },
  { ref: 'poster-library', label: 'Poster, library', kind: 'place', responses: 1 },
]
export const EXAMPLE_UNTAGGED = 1

interface Toast { id: number; text: string }

interface Store {
  slug: string
  setSlug: (s: string) => void
  shortLink: string
  url: (ref?: string) => string
  display: (ref?: string) => string
  trackQr: boolean
  setTrackQr: (v: boolean) => void
  downloadedLink: string | null
  markDownloaded: () => void
  sources: Source[]
  addSource: (label: string) => Source
  toast: (text: string) => void
  qrOpen: boolean
  setQrOpen: (v: boolean) => void
  endingOpen: boolean
  setEndingOpen: (v: boolean) => void
  previewOpen: boolean
  setPreviewOpen: (v: boolean) => void
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
  const [trackQr, setTrackQr] = useState(true)
  const [downloadedLink, setDownloaded] = useState<string | null>(null)
  const [sources, setSources] = useState<Source[]>(EXAMPLE_SOURCES)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [qrOpen, setQrOpen] = useState(false)
  const [endingOpen, setEndingOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [qrRef, setQrRef] = useState('qr')
  const nextId = useRef(1)

  const toast = useCallback((text: string) => {
    const id = nextId.current++
    setToasts([{ id, text }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600)
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

  const value = useMemo<Store>(() => ({
    slug, setSlug, shortLink, url, display, trackQr, setTrackQr,
    downloadedLink, markDownloaded: () => setDownloaded(`tally.so/r/${slug}`),
    sources, addSource, toast, qrOpen, setQrOpen, endingOpen, setEndingOpen, previewOpen, setPreviewOpen, qrRef, setQrRef,
  }), [slug, shortLink, url, display, trackQr, downloadedLink, sources, addSource, toast, qrOpen, endingOpen, previewOpen, qrRef])

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="toast-wrap" aria-live="polite" role="status">
        {toasts.map((t) => (
          <div className="toast" key={t.id}><Check aria-hidden />{t.text}</div>
        ))}
      </div>
    </Ctx.Provider>
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
