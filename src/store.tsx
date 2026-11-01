import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Check } from 'lucide-react'
import { DEFAULT_STYLE, isLogoData, logoLoads, type QrFormat, type QrStyle } from './qr'
import { tick } from './guide'
import { DIRECT, FRESH, MAIN_QR, MAIN_QR_LABEL, SEED, ZERO, type Counts, type SeedPlace } from './seed'

export const FORM_ID = 'KpYalV'

/**
 * Every QR code opens the form by its ID, tagged with its ref. The ID never changes, so printed
 * codes keep working whatever the link ending or domain is.
 */
/** The line printed under a code: always the form ID link, so print never depends on a custom ending. */
export const QR_CAPTION = `tally.so/r/${FORM_ID}`
export const qrUrl = (ref: string) => `https://tally.so/r/${FORM_ID}?ref=${ref === MAIN_QR ? mainRefFor(window.location.hash) : ref}`

/** Recording the changelog GIF (codes=main&demo=changelog): your form's own code carries the changelog ref, like every other visual. */
function mainRefFor(hash: string) {
  return /[?&]demo=changelog\b/.test(hash) ? 'qr-changelog' : MAIN_QR
}
export const FORM_TITLE = 'Community picnic RSVP'
/** The ending a custom domain starts with: the form's title as a slug (Community picnic RSVP gives community-picnic-rsvp). */
export const DEFAULT_ENDING = slugify(FORM_TITLE)
export const EASTER_EGG = 'https://tally.so/r/KpYalV?ref=qr'

export interface Source {
  ref: string
  label: string
  kind: 'qr' | 'social' | 'email' | 'custom'
  responses: number
  /** Visits and responses per range, for Insights. */
  counts: Counts
  /** Removed from Share: the code keeps working and its responses stay in Insights. */
  hidden?: boolean
}

export { MAIN_QR, MAIN_QR_LABEL }

/** Example numbers only, from the one shared seed. */
const toSource = (p: SeedPlace): Source => ({ ref: p.ref, label: p.label, kind: p.kind, responses: p.counts.all[1], counts: p.counts })
export const EXAMPLE_SOURCES: Source[] = SEED.map(toSource)

/** A form you are publishing starts fresh; the Share tab and Insights show the example data. */
export type Dataset = 'fresh' | 'example'
export function datasetForHash(hash: string): Dataset {
  const h = hash.replace(/^#\/?/, '')
  const [path, q = ''] = h.split('?')
  const onEdit = path === '' || path === 'edit'
  return onEdit && new URLSearchParams(q).get('pub') !== 'data' ? 'fresh' : 'example'
}

/** The prototype can play the free plan or Pro. Free lets you try the link ending and a logo, but not save them. */
export type Plan = 'free' | 'pro'
const PLAN_KEY = 'proto-plan'
/** Prototype bar: `?link=custom` starts with a saved custom ending on your own domain, on Pro. */
export const CUSTOM_MOCK = { domain: 'forms.acme.com', ending: DEFAULT_ENDING }
const customMock = () => /[?&]link=custom\b/.test(window.location.hash)
export const PRICING_URL = 'https://tally.so/pricing'

/** Last QR settings, so the next download looks the same. */
export interface QrSettings { style: QrStyle; format: QrFormat; showLink: boolean }
const SETTINGS_KEY = 'qr-settings'
function loadSettings(): QrSettings {
  const base: QrSettings = { style: DEFAULT_STYLE, format: 'png', showLink: true }
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return base
    const v = JSON.parse(raw)
    // Older saves carried a colour and a mode; only an uploaded logo carries over.
    const logo = v.style?.mode !== 'tally' && isLogoData(v.style?.logo) ? v.style.logo : null
    return { style: { ...DEFAULT_STYLE, logo }, format: v.format ?? 'png', showLink: true }
  } catch { return base }
}
export const EXAMPLE_UNTAGGED = DIRECT.all[1]

export interface ToastAction { label: string; onClick: () => void }
/** Every toast and alert shows at the bottom. `group`: a new toast in the same group replaces the old one. `top` is kept for callers and no longer moves it. */
export interface ToastOptions { action?: ToastAction; duration?: number; top?: boolean; group?: string }
interface Toast { id: number; text: string; leaving?: boolean; action?: ToastAction; duration: number; top?: boolean; group?: string }

interface Store {
  slug: string
  setSlug: (s: string) => void
  /** Endings this form used before. They keep redirecting and stay reserved for this form. */
  oldEndings: string[]
  removeEnding: (e: string) => void
  plan: Plan
  setPlan: (p: Plan) => void
  /** The one upgrade path: Tally's plans pop-up. A pretend upgrade switches the prototype to Pro. */
  upgrade: () => void
  upgradeOpen: boolean
  closeUpgrade: () => void
  setDataset: (d: Dataset) => void
  /** Pro: your own domain, shown in the short link. */
  domain: string
  setDomain: (d: string) => void
  shortLink: string
  url: (ref?: string) => string
  display: (ref?: string) => string
  downloadedLink: string | null
  markDownloaded: () => void
  sources: Source[]
  addSource: (label: string) => Source
  toast: (text: string, opts?: ToastOptions) => void
  /** Clears the alerts of one group, like QR downloads when you switch tab or view. */
  dismissGroup: (group: string) => void
  qrOpen: boolean
  setQrOpen: (v: boolean) => void
  placements: Source[]
  addPlacement: (label: string) => Source
  removePlacement: (ref: string) => void
  restorePlacement: (ref: string) => void
  settings: QrSettings
  setSettings: (s: QrSettings) => void
  qrRef: string
  /** Open the QR modal with Personalize already expanded. */
  qrPersonalize: boolean
  setQrPersonalize: (v: boolean) => void
  setQrRef: (r: string) => void
}

const Ctx = createContext<Store | null>(null)
export const useStore = () => useContext(Ctx)!

/** Lowercase, hyphens, no accents or special characters. While typing, a trailing hyphen is kept so you can type the next word. */
export function slugify(s: string, typing = false) {
  const t = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+/, '')
  return (typing ? t : t.replace(/-+$/, '')).slice(0, 40)
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [slug, setSlugState] = useState(() => (customMock() ? CUSTOM_MOCK.ending : FORM_ID))
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
  const [sources, setSources] = useState<Source[]>(() => (datasetForHash(window.location.hash) === 'fresh' ? FRESH : SEED).map(toSource))
  const setDataset = useCallback((d: Dataset) => {
    setSources((cur) => {
      // Keep codes and links you made yourself; swap only the seeded ones.
      const seeded = new Set([...SEED, ...FRESH].map((p) => p.ref))
      const mine = cur.filter((x) => !seeded.has(x.ref))
      const base = (d === 'fresh' ? FRESH : SEED).map(toSource)
      return [...base.filter((b) => !mine.some((m) => m.ref === b.ref)), ...mine]
    })
  }, [])
  const [plan, setPlanState] = useState<Plan>(() => { if (customMock()) return 'pro'; try { return localStorage.getItem(PLAN_KEY) === 'pro' ? 'pro' : 'free' } catch { return 'free' } })
  const setPlan = useCallback((p: Plan) => { setPlanState(p); try { localStorage.setItem(PLAN_KEY, p) } catch { /* private mode */ } }, [])
  const [toasts, setToasts] = useState<Toast[]>([])
  const [qrOpen, setQrOpen] = useState(false)
  const [settings, setSettingsState] = useState<QrSettings>(loadSettings)
  const setSettings = useCallback((v: QrSettings) => {
    setSettingsState(v)
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(v)) } catch { /* private mode */ }
  }, [])
  // A saved logo the browser can't draw is dropped, so the white Tally mark shows instead of a broken image.
  useEffect(() => {
    const logo = settings.style.logo
    if (!logo) return
    let live = true
    logoLoads(logo).then((ok) => { if (live && !ok) setSettings({ ...settings, style: { ...settings.style, logo: null } }) })
    return () => { live = false }
  }, [settings.style.logo]) // eslint-disable-line react-hooks/exhaustive-deps
  const [qrRef, setQrRef] = useState('qr')
  const [qrPersonalize, setQrPersonalize] = useState(false)
  const [domain, setDomain] = useState(() => (customMock() ? CUSTOM_MOCK.domain : ''))
  const nextId = useRef(1)

  /** Toasts stack, up to three. Each one times itself (pausing while hovered or focused), leaves the way it came in, then unmounts. */
  const leave = useCallback((lid: number) => {
    setToasts((t) => t.map((x) => (x.id === lid ? { ...x, leaving: true } : x)))
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== lid)), 200)
  }, [])
  const dismissGroup = useCallback((g: string) => {
    setToasts((t) => { t.filter((x) => x.group === g && !x.leaving).forEach((x) => setTimeout(() => leave(x.id))); return t })
  }, [leave])
  const toast = useCallback((text: string, opts: ToastOptions = {}) => {
    const id = nextId.current++
    const duration = opts.duration ?? (opts.action ? 6000 : 2600)
    setToasts((t) => {
      // Same group: the new one replaces the old one, no stacking.
      if (opts.group) t.filter((x) => x.group === opts.group && !x.leaving).forEach((x) => setTimeout(() => leave(x.id)))
      const live = t.filter((x) => !x.leaving)
      if (live.length >= 3) setTimeout(() => leave(live[0].id))
      return [...t, { id, text, action: opts.action, duration, top: opts.top, group: opts.group }]
    })
    // In a bottom sheet, keep the field you just used clear of the toast.
    requestAnimationFrame(() => {
      const el = document.activeElement
      if (el instanceof HTMLElement && el.closest('.sheet-body')) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    })
  }, [leave])

  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const upgrade = useCallback(() => setUpgradeOpen(true), [])
  const closeUpgrade = useCallback(() => setUpgradeOpen(false), [])

  // A custom ending only exists on your own domain (Pro), as an extra address. tally.so/r/<form ID> always stays live.
  const base = domain ? `${domain}/${slug}` : `tally.so/r/${FORM_ID}`
  const shortLink = base
  const url = useCallback((ref?: string) => `https://${base}${ref ? `?ref=${ref}` : ''}`, [base])
  const display = useCallback((ref?: string) => `${base}${ref ? `?ref=${ref}` : ''}`, [base])

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
    if (same) { if (same.hidden) setSources((all) => all.map((x) => (x.ref === same.ref ? { ...x, hidden: false } : x))); return same }
    const base = `qr-${slugify(name) || 'code'}`
    let ref = base
    for (let i = 2; sources.some((s) => s.ref === ref); i++) ref = `${base}-${i}`
    const s: Source = { ref, label: name, kind: 'qr', responses: 0, counts: ZERO }
    setSources((all) => [...all, s])
    return s
  }, [sources])
  /** Remove only takes a code out of Share; it stays in place, hidden, so Undo puts it back where it was. */
  const removePlacement = useCallback((ref: string) => {
    if (ref === MAIN_QR) return
    setSources((all) => all.map((x) => (x.ref === ref ? { ...x, hidden: true } : x)))
  }, [])
  const restorePlacement = useCallback((ref: string) => {
    setSources((all) => all.map((x) => (x.ref === ref ? { ...x, hidden: false } : x)))
  }, [])
  /** Your form's own code first, then the others in the order they were made. */
  const placements = useMemo(() => {
    const qr = sources.filter((s) => s.kind === 'qr' && !s.hidden)
    return [...qr.filter((s) => s.ref === MAIN_QR), ...qr.filter((s) => s.ref !== MAIN_QR)]
  }, [sources])

  const value = useMemo<Store>(() => ({
    slug, setSlug, oldEndings, removeEnding, plan, setPlan, upgrade, upgradeOpen, closeUpgrade, setDataset, domain, setDomain, shortLink, url, display,
    downloadedLink, markDownloaded: () => setDownloaded(QR_CAPTION),
    sources, addSource, toast, dismissGroup, qrOpen, setQrOpen, qrRef, setQrRef, qrPersonalize, setQrPersonalize, placements, addPlacement, removePlacement, restorePlacement, settings, setSettings,
  }), [slug, setSlug, oldEndings, removeEnding, plan, setPlan, upgrade, upgradeOpen, closeUpgrade, setDataset, domain, setDomain, shortLink, url, display, downloadedLink, sources, addSource, toast, dismissGroup, qrOpen, qrRef, qrPersonalize, placements, addPlacement, removePlacement, restorePlacement, settings, setSettings])

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
