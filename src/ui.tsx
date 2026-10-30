import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import { Check, ChevronDown, Copy, Download, X } from 'lucide-react'
import { planCopy } from './copy'
import { copyText, useIsMobile, useStore } from './store'
import { codeSvg, svgSrc, type QrStyle } from './qr'

export function Switch({ checked, onChange, label, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; id?: string }) {
  return (
    <button type="button" role="switch" id={id} aria-checked={checked} aria-label={label} className="switch" onClick={() => onChange(!checked)} />
  )
}

export function Segmented<T extends string>({ value, onChange, options, label }: {
  value: T; onChange: (v: T) => void; label: string
  options: { value: T; label: ReactNode; icon?: ReactNode }[]
}) {
  const i = Math.max(0, options.findIndex((o) => o.value === value))
  return (
    <div className="segmented" role="tablist" aria-label={label} style={{ ['--seg-n' as string]: options.length }}>
      {/* One indicator that slides, so a change reads as one thing moving. */}
      <span className="seg-ind" aria-hidden style={{ transform: `translateX(calc(${i} * (100% + 2px)))` }} />
      {options.map((o) => (
        <button key={o.value} type="button" role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)}>
          {o.icon}{o.label}
        </button>
      ))}
    </div>
  )
}

/** On a key change, eases from the old height to the new one and fades the new content in. Otherwise height is auto. */
export function AutoHeight({ k, children, slow = false }: { k: string; children: ReactNode; slow?: boolean }) {
  const inner = useRef<HTMLDivElement>(null)
  const last = useRef(0)
  const first = useRef(true)
  const [h, setH] = useState<number | null>(null)
  useLayoutEffect(() => {
    if (first.current) { first.current = false; return }
    const el = inner.current
    if (!el) return
    const from = last.current
    setH(from)
    const r = requestAnimationFrame(() => { const to = el.offsetHeight; setH(to === from ? null : to) })
    // Never stay pinned if the transition doesn't fire.
    const t = window.setTimeout(() => setH(null), 320)
    return () => { cancelAnimationFrame(r); window.clearTimeout(t) }
  }, [k])
  // Track the settled height (also while a Collapse inside grows), so a key change knows where it starts from.
  const pinned = useRef(false)
  pinned.current = h !== null
  useEffect(() => {
    const el = inner.current
    if (!el) return
    last.current = el.offsetHeight
    const ro = new ResizeObserver(() => { if (!pinned.current) last.current = el.offsetHeight })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <div className={`auto-h ${slow ? 'is-slow' : ''} ${h !== null ? 'is-moving' : ''}`} style={h !== null ? { height: h } : undefined}
      onTransitionEnd={(e) => { if (e.target === e.currentTarget) setH(null) }}>
      <div ref={inner}><div key={k} className="fade-in">{children}</div></div>
    </div>
  )
}

/** On the free plan, the primary action of a Pro setting. Nothing is saved. */
export function UpgradeButton({ onClick, disabled = false }: { onClick: () => void; disabled?: boolean }) {
  return <button type="button" className="btn btn-black btn-sm upgrade-btn" disabled={disabled} onClick={onClick}>{planCopy.upgradeToSave}<Pro /></button>
}

export function Pro() {
  return <span className="badge" title="Available on Tally Pro">Pro</span>
}

/** The one primary action. Feedback is instant and in place, no animation in front of it. */
export function CopyButton({ text, className = '', big = false, label = 'Copy', toastText = 'Link copied. Go spread the word.' }: {
  text: string; className?: string; big?: boolean; label?: string; toastText?: string | null
}) {
  const { toast } = useStore()
  const [copied, setCopied] = useState(false)
  const timer = useRef<number>()
  const onClick = async () => {
    setCopied(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), 2000)
    await copyText(text)
    if (toastText) toast(toastText)
  }
  return (
    <button type="button" className={`btn btn-black ${big ? 'btn-lg' : ''} ${copied ? 'is-copied' : ''} ${className}`} onClick={onClick} aria-label={`${label} ${text}`}>
      <IconSwap on={copied} />
      {/* Same as today's Tally: the icon turns into a check, the label stays. */}
      <span>{label}</span>
      <span className="sr-only" aria-live="polite">{copied ? 'Copied' : ''}</span>
    </button>
  )
}

export function SmallCopy({ text, label = 'Copy', toastText = 'Link copied. Go spread the word.' }: { text: string; label?: string; toastText?: string }) {
  const [copied, setCopied] = useState(false)
  const { toast } = useStore()
  return (
    <button type="button" className={`btn btn-secondary btn-sm ${copied ? 'is-copied' : ''}`} aria-label={`${label} ${text.length > 80 ? '' : text}`.trim()}
      onClick={async () => { setCopied(true); setTimeout(() => setCopied(false), 2000); await copyText(text); toast(toastText) }}>
      <IconSwap on={copied} />{label}
      <span className="sr-only" aria-live="polite">{copied ? 'Copied' : ''}</span>
    </button>
  )
}

/** Copy and Check share one slot and cross-fade, so the icon morphs instead of swapping. */
export function IconSwap({ on, icon }: { on: boolean; icon?: 'copy' | 'download' }) {
  return (
    <span className="icon-swap" data-on={on} aria-hidden>
      {icon === 'download' ? <Download className="icon-a" /> : <Copy className="icon-a" />}
      <Check className="icon-b" />
    </span>
  )
}

/** Height and opacity reveal for content that opens in place. Hidden content is inert. */
export function Collapse({ open, id, gap = 0, children }: { open: boolean; id?: string; gap?: number; children: ReactNode }) {
  const [settled, setSettled] = useState(open)
  useEffect(() => { if (!open) setSettled(false) }, [open])
  const inert = open ? {} : { inert: '' }
  return (
    <div className={`collapse ${open ? 'is-open' : ''} ${open && settled ? 'is-settled' : ''}`} id={id} aria-hidden={!open}
      onTransitionEnd={(e) => { if (e.target === e.currentTarget && e.propertyName === 'grid-template-rows' && open) setSettled(true) }}
      style={gap ? { marginTop: -gap } : undefined} {...(inert as object)}>
      {/* The parent's flex gap moves inside, so a closed panel takes no space at all. */}
      <div className="collapse-inner">{gap ? <div style={{ paddingTop: gap }}>{children}</div> : children}</div>
    </div>
  )
}

export function QrImage({ url, style, size = 120, label }: { url: string; style: QrStyle; size?: number; label?: string }) {
  const src = useMemo(() => svgSrc(codeSvg(url, style)), [url, style])
  return <img src={src} width={size} height={size} alt={label ?? `QR code for ${url}`} style={{ display: 'block' }} draggable />
}

/** A row that opens in place. No pop-ups on top of the share sheet. */
export function Expand({ id, icon, title, help, right, open, onToggle, children }: {
  id: string; icon?: ReactNode; title: ReactNode; help?: ReactNode; right?: ReactNode; open: boolean; onToggle: () => void; children: ReactNode
}) {
  return (
    <div className={`expand ${open ? 'is-open' : ''}`}>
      <button type="button" className="list-row" aria-expanded={open} aria-controls={`x-${id}`} onClick={onToggle}>
        {icon && <span className="row-icon">{icon}</span>}
        <span className="grow"><span className="title row gap-8">{title}</span>{help && <span className="help" style={{ display: 'block' }}>{help}</span>}</span>
        {right}
        <ChevronDown aria-hidden className="expand-chev" />
      </button>
      <Collapse open={open} id={`x-${id}`}><div className="expand-body">{children}</div></Collapse>
    </div>
  )
}

/** Set when a dialog is closed from the keyboard, so it closes without an exit animation. */
let keyClosedAt = 0
const closedByKey = () => performance.now() - keyClosedAt < 120

function useEscape(onClose: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return
    const on = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      // Let an open menu close first.
      if (document.querySelector('[data-menu-open="true"]')) return
      keyClosedAt = performance.now()
      onClose()
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [onClose, active])
}

/**
 * While a sheet or modal is open, toasts sit just above its footer, never over its fields.
 * Stacked dialogs: the topmost one wins.
 */
const anchors: (() => string | null)[] = []
function placeToasts() {
  const top = anchors[anchors.length - 1]
  const v = top?.()
  if (v) document.documentElement.style.setProperty('--toast-bottom', v)
  else document.documentElement.style.removeProperty('--toast-bottom')
}
function useToastAnchor(open: boolean, boxRef: RefObject<HTMLElement | null>, footerRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return
    const measure = () => {
      const f = footerRef.current
      const box = boxRef.current
      // A centered modal with room below it leaves toasts where they are.
      if (box && !box.classList.contains('sheet') && window.innerHeight - box.getBoundingClientRect().bottom >= 72) return null
      if (f) return `${Math.max(16, window.innerHeight - f.getBoundingClientRect().top + 8)}px`
      // No footer: a bottom sheet keeps toasts low and scrolls the focused field clear (see toast()).
      return boxRef.current?.classList.contains('sheet') ? 'calc(12px + var(--safe-b))' : null
    }
    anchors.push(measure)
    placeToasts()
    const ro = new ResizeObserver(placeToasts)
    if (boxRef.current) ro.observe(boxRef.current)
    window.addEventListener('resize', placeToasts)
    return () => {
      ro.disconnect(); window.removeEventListener('resize', placeToasts)
      anchors.splice(anchors.indexOf(measure), 1); placeToasts()
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
}

export function Modal({ open, onClose, title, children, footer, width = 440, icon, labelledBy }: {
  open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; width?: 400 | 440 | 700; icon?: ReactNode; labelledBy?: string
}) {
  useEscape(onClose, open)
  const ref = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(open)
  const [leaving, setLeaving] = useState(false)
  useEffect(() => {
    if (open) { setMounted(true); setLeaving(false); return }
    if (!mounted) return
    // Keyboard closes are instant. Pointer closes fade out, faster than they came in.
    if (closedByKey()) { setMounted(false); return }
    setLeaving(true)
    const t = setTimeout(() => { setMounted(false); setLeaving(false) }, 150)
    return () => clearTimeout(t)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (open) ref.current?.focus() }, [open, mounted])
  useToastAnchor(open && mounted, ref, footerRef)
  if (!mounted) return null
  const id = labelledBy ?? 'modal-title'
  return (
    <div className="overlay" data-state={leaving ? 'closed' : 'open'} onMouseDown={(e) => { if (e.target === e.currentTarget && !leaving) onClose() }}>
      <div className={`modal w-${width}`} role="dialog" aria-modal="true" aria-labelledby={id} tabIndex={-1} ref={ref} style={{ outline: 'none' }}>
        <div className="modal-header">
          {icon}
          <h2 id={id}>{title}</h2>
          <button type="button" className="btn btn-ghost btn-sm icon-btn" onClick={onClose} aria-label="Close"><X aria-hidden /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer" ref={footerRef}>{footer}</div>}
      </div>
    </div>
  )
}

/** Bottom sheet with a drag handle and two snap points (50% and 90%). Close never scrolls away. */
export function Sheet({ open, onClose, title, children, footer, snap: initialSnap = 'auto', labelledBy }: {
  open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; snap?: 'auto' | 'half' | 'full'; labelledBy?: string
}) {
  const [mounted, setMounted] = useState(open)
  const [state, setState] = useState<'open' | 'closed'>('closed')
  const [snap, setSnap] = useState(initialSnap)
  const drag = useRef<{ y: number; dy: number; t: number; id: number } | null>(null)
  const dragged = useRef(false)
  const sheetRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)
  useToastAnchor(open, sheetRef, footerRef)
  useEscape(onClose, open)
  useEffect(() => {
    if (open) {
      setMounted(true)
      setSnap(initialSnap)
      requestAnimationFrame(() => requestAnimationFrame(() => setState('open')))
    } else {
      setState('closed')
      const t = setTimeout(() => setMounted(false), 320)
      return () => clearTimeout(t)
    }
  }, [open, initialSnap])
  if (!mounted) return null
  const id = labelledBy ?? 'sheet-title'
  const onDown = (e: React.PointerEvent) => {
    // One finger at a time, and buttons in the header stay buttons.
    if (drag.current) return
    const target = e.target as HTMLElement
    if (target.closest('button') && !target.closest('.sheet-handle')) return
    drag.current = { y: e.clientY, dy: 0, t: performance.now(), id: e.pointerId }
    dragged.current = false
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current, el = sheetRef.current
    if (!d || !el || e.pointerId !== d.id) return
    d.dy = e.clientY - d.y
    if (Math.abs(d.dy) > 4) dragged.current = true
    // Down follows the finger. Up meets rising friction instead of a hard stop.
    const y = d.dy > 0 ? d.dy : -Math.min(24, Math.sqrt(-d.dy) * 2)
    el.style.transition = 'none'
    el.style.transform = `translateY(${y}px)`
    if (overlayRef.current) {
      overlayRef.current.style.transition = 'none'
      overlayRef.current.style.opacity = String(d.dy > 0 ? Math.max(0, 1 - d.dy / el.offsetHeight) : 1)
    }
  }
  const onUp = (e: React.PointerEvent) => {
    const d = drag.current, el = sheetRef.current
    if (!d || e.pointerId !== d.id) return
    drag.current = null
    if (!el) return
    const dy = d.dy
    const velocity = Math.abs(dy) / Math.max(1, performance.now() - d.t)
    el.style.transition = ''
    el.style.transform = ''
    if (overlayRef.current) { overlayRef.current.style.transition = ''; overlayRef.current.style.opacity = '' }
    // A quick flick is enough, no need to drag past a line.
    if (dy > 120 || (dy > 12 && velocity > 0.11)) onClose()
    else if (dy < -40) setSnap('full')
    else if (dy > 40 && snap === 'full') setSnap('half')
  }
  const dragProps = { onPointerDown: onDown, onPointerMove: onMove, onPointerUp: onUp, onPointerCancel: onUp }
  return (
    <>
      <div className="sheet-overlay" data-state={state} onClick={onClose} ref={overlayRef} />
      <div className="sheet" data-state={state} data-snap={snap} role="dialog" aria-modal="true" aria-labelledby={id} ref={sheetRef}>
        <div className="sheet-handle-hit" {...dragProps}>
          <button type="button" className="sheet-handle" aria-label={snap === 'full' ? 'Make smaller' : 'Expand'}
            onClick={() => { if (dragged.current) { dragged.current = false; return } setSnap(snap === 'full' ? 'half' : 'full') }} />
        </div>
        <div className="sheet-header" {...dragProps}>
          <h2 id={id}>{title}</h2>
          <button type="button" className="btn btn-ghost icon-btn" style={{ width: 44, height: 44 }} onClick={onClose} aria-label="Close"><X aria-hidden /></button>
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-footer" ref={footerRef}>{footer}</div>}
      </div>
    </>
  )
}

/** Modal on desktop, bottom sheet on mobile. */
export function Dialog(props: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; width?: 400 | 440 | 700; snap?: 'auto' | 'half' | 'full'; labelledBy?: string }) {
  const mobile = useIsMobile()
  return mobile ? <Sheet {...props} /> : <Modal {...props} />
}

export function Menu({ open, onClose, children, style }: { open: boolean; onClose: () => void; children: ReactNode; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose() } }
    setTimeout(() => document.addEventListener('mousedown', onDoc))
    window.addEventListener('keydown', onKey, true)
    ref.current?.querySelector('button')?.focus()
    return () => { document.removeEventListener('mousedown', onDoc); window.removeEventListener('keydown', onKey, true) }
  }, [open, onClose])
  if (!open) return null
  // Scale in from the corner nearest the trigger.
  const origin = style?.right !== undefined ? 'top right' : 'top left'
  return <div className="menu" role="menu" ref={ref} style={{ transformOrigin: origin, ...style }} data-menu-open="true">{children}</div>
}
