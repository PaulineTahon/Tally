import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Check, Copy, X } from 'lucide-react'
import { copyText, useIsMobile, useStore } from './store'
import { buildSvg } from './qr'

export function Switch({ checked, onChange, label, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; id?: string }) {
  return (
    <button type="button" role="switch" id={id} aria-checked={checked} aria-label={label} className="switch" onClick={() => onChange(!checked)} />
  )
}

export function Segmented<T extends string>({ value, onChange, options, label }: {
  value: T; onChange: (v: T) => void; label: string
  options: { value: T; label: ReactNode; icon?: ReactNode }[]
}) {
  return (
    <div className="segmented" role="tablist" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)}>
          {o.icon}{o.label}
        </button>
      ))}
    </div>
  )
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
    <button type="button" className={`btn btn-black ${big ? 'btn-lg' : ''} ${className}`} onClick={onClick} aria-label={copied ? 'Copied' : `${label} ${text}`}>
      {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
      <span style={{ minWidth: big ? 64 : 52, textAlign: 'left' }}>{copied ? 'Copied' : label}</span>
    </button>
  )
}

export function SmallCopy({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const { toast } = useStore()
  return (
    <button type="button" className="btn btn-secondary btn-sm" aria-label={`${label} ${text}`}
      onClick={async () => { setCopied(true); setTimeout(() => setCopied(false), 2000); await copyText(text); toast('Link copied. Go spread the word.') }}>
      {copied ? <Check aria-hidden /> : <Copy aria-hidden />}{copied ? 'Copied' : label}
    </button>
  )
}

export function QrImage({ url, color = '#000', logo = false, size = 120, label }: { url: string; color?: string; logo?: boolean; size?: number; label?: string }) {
  const src = useMemo(() => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(buildSvg({ url, shortLink: '', color, logo, madeWithTally: false }, { caption: false })), [url, color, logo])
  return <img src={src} width={size} height={size} alt={label ?? `QR code for ${url}`} style={{ display: 'block', imageRendering: 'pixelated' }} draggable />
}

function useEscape(onClose: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return
    const on = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      // Let an open menu close first.
      if (document.querySelector('[data-menu-open="true"]')) return
      onClose()
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [onClose, active])
}

export function Modal({ open, onClose, title, children, footer, width = 440, icon, labelledBy }: {
  open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; width?: 400 | 440 | 700; icon?: ReactNode; labelledBy?: string
}) {
  useEscape(onClose, open)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { if (open) ref.current?.focus() }, [open])
  if (!open) return null
  const id = labelledBy ?? 'modal-title'
  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className={`modal w-${width}`} role="dialog" aria-modal="true" aria-labelledby={id} tabIndex={-1} ref={ref} style={{ outline: 'none' }}>
        <div className="modal-header">
          {icon}
          <h2 id={id}>{title}</h2>
          <button type="button" className="btn btn-ghost btn-sm icon-btn" onClick={onClose} aria-label="Close"><X aria-hidden /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
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
  const drag = useRef<{ y: number; dy: number } | null>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  useEscape(onClose, open)
  useEffect(() => {
    if (open) {
      setMounted(true)
      setSnap(initialSnap)
      requestAnimationFrame(() => requestAnimationFrame(() => setState('open')))
    } else {
      setState('closed')
      const t = setTimeout(() => setMounted(false), 450)
      return () => clearTimeout(t)
    }
  }, [open, initialSnap])
  if (!mounted) return null
  const id = labelledBy ?? 'sheet-title'
  const onDown = (e: React.PointerEvent) => { drag.current = { y: e.clientY, dy: 0 }; (e.target as HTMLElement).setPointerCapture(e.pointerId) }
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current || !sheetRef.current) return
    drag.current.dy = e.clientY - drag.current.y
    if (drag.current.dy > 0) { sheetRef.current.style.transition = 'none'; sheetRef.current.style.transform = `translateY(${drag.current.dy}px)` }
  }
  const onUp = () => {
    const el = sheetRef.current
    const dy = drag.current?.dy ?? 0
    drag.current = null
    if (!el) return
    el.style.transition = ''
    el.style.transform = ''
    if (dy > 120) onClose()
    else if (dy < -40) setSnap('full')
    else if (dy > 40 && snap === 'full') setSnap('half')
  }
  return (
    <>
      <div className="sheet-overlay" data-state={state} onClick={onClose} />
      <div className="sheet" data-state={state} data-snap={snap} role="dialog" aria-modal="true" aria-labelledby={id} ref={sheetRef}>
        <div className="sheet-handle-hit" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          <button type="button" className="sheet-handle" aria-label={snap === 'full' ? 'Make smaller' : 'Expand'} onClick={() => setSnap(snap === 'full' ? 'half' : 'full')} />
        </div>
        <div className="sheet-header">
          <h2 id={id}>{title}</h2>
          <button type="button" className="btn btn-ghost icon-btn" style={{ width: 44, height: 44 }} onClick={onClose} aria-label="Close"><X aria-hidden /></button>
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-footer">{footer}</div>}
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
  return <div className="menu" role="menu" ref={ref} style={style} data-menu-open="true">{children}</div>
}
