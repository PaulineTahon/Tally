import { useEffect, useRef, useState } from 'react'
import { screenHref } from './params'
import { ChevronDown, Download, Maximize2, Share, X, Upload, Plus } from 'lucide-react'
import { EASTER_EGG, FORM_TITLE, MAIN_QR, canNativeShare, slugify, useIsMobile, useStore } from './store'
import { tick } from './guide'
import { EGG_TITLE, planCopy } from './copy'
import { Dialog, PopMenu, Pro } from './ui'
import { buildSvg, isLogoData, logoLoads, codeSvg, download, fileFor, pngBlob, svgSrc, type QrFormat, type QrOptions, type QrStyle } from './qr'

export const FORMATS: { id: QrFormat; label: string; help: string }[] = [
  { id: 'svg', label: 'SVG', help: 'Sharp at any size. Best for print.' },
  { id: 'pdf', label: 'PDF', help: 'Ready to print' },
  { id: 'png', label: 'PNG', help: 'PNG works best in Canva, Word and Slides' },
]

export const fileName = (ref: string, ext: string) => `${slugify(FORM_TITLE)}-${ref}.${ext}`

/**
 * Phones: the system share sheet with the print-size PNG (it covers Save to Photos).
 * If files can't be shared, the PNG downloads instead.
 */
export async function saveOrShare(opts: QrOptions, ref: string): Promise<'shared' | 'downloaded' | 'closed'> {
  const blob = await pngBlob(opts)
  const f = new File([blob], fileName(ref, 'png'), { type: 'image/png' })
  if (canNativeShare() && navigator.canShare?.({ files: [f] })) {
    try { await navigator.share({ files: [f] }); return 'shared' } catch { return 'closed' }
  }
  download(blob, fileName(ref, 'png'))
  return 'downloaded'
}

/** QR actions confirm with a small alert on top of the dialog, not in the button. A new one replaces the old one. */
export const QR_ALERT = { group: 'qr', duration: 4000 }

export const QR_COPY = {
  yourCode: 'Your QR Code',
  remove: 'Remove',
  removed: 'Removed. The code still works and its responses stay tagged.',
  moreFor: (label: string) => `More options for ${label} QR code`,
  openFor: (label: string) => `${label} QR code, open details`,
  downloadPng: 'Download PNG',
  download: 'Download',
  downloadPngFor: (label: string) => `Download ${label} as PNG`,
  downloadAs: (f: string) => `Download ${f}`,
  saveOrShare: 'Save image',
  otherFormats: 'Other formats',
  downloadedAs: (f: QrFormat) => `${f.toUpperCase()} downloaded`,
  imageSaved: 'Image saved',
  logo: 'Add your logo',
  withoutLogo: 'Download without logo',
  singleDesc: 'Print it or add it to slides. Responses are tagged, see them in',
  addAnother: 'Add another code',
  customizeCode: 'Customize QR code',
  logoHelp: 'Replaces the Tally mark on all your QR codes.',
  logoUnreadable: "That image can't be used. Try a PNG, JPG or SVG.",
}

export function useQrOptions(ref: string): QrOptions {
  const s = useStore()
  return { url: s.qrUrl(ref), shortLink: s.qrLink, style: s.settings.style, showLink: true }
}

/**
 * Download as one split button, the same in the QR Code tab and in the QR detail: PNG (or Save image on a phone)
 * on the main part, SVG and PDF in a menu that renders above the sheet, never clipped by it.
 */
export function DownloadSplit({ refId, label, onDone, primaryRef, upgradePrimary = false }: {
  refId: string; label: string; onDone?: () => void; primaryRef?: React.Ref<HTMLButtonElement>
  /** Where Copy isn't on screen (the code's page), Download, or Upgrade to download, is the black primary. */
  upgradePrimary?: boolean
}) {
  const s = useStore()
  const mobile = useIsMobile()
  const opts = useQrOptions(refId)
  const [menu, setMenu] = useState(false)
  const caret = useRef<HTMLButtonElement>(null)
  const after = () => { if (refId === MAIN_QR) tick('download-main'); s.markDownloaded(); onDone?.() }
  const get = async (f: QrFormat) => { download(await fileFor(opts, f), fileName(refId, f)); after(); s.toast(QR_COPY.downloadedAs(f), QR_ALERT) }
  const share = async () => { after(); if ((await saveOrShare(opts, refId)) !== 'closed') s.toast(QR_COPY.imageSaved, QR_ALERT) }
  // The same code with the Tally mark, free on every plan.
  const plain = { ...opts, style: { ...opts.style, logo: null } }
  const getPlain = async () => { download(await fileFor(plain, 'png'), fileName(refId, 'png')); after(); s.toast(QR_COPY.downloadedAs('png'), QR_ALERT) }
  const sharePlain = async () => { after(); if ((await saveOrShare(plain, refId)) !== 'closed') s.toast(QR_COPY.imageSaved, QR_ALERT) }
  const others = FORMATS.filter((f) => (mobile ? true : f.id !== 'png'))
  // Free can try a logo. While one is in, the code can be seen but downloading it is Pro.
  if (s.plan !== 'pro' && s.settings.style.logo) {
    return (
      <div className="split split-out is-upgrade">
        <button ref={primaryRef} type="button" className={`btn ${upgradePrimary ? 'btn-black' : 'btn-secondary'} btn-sm split-solo ${primaryRef ? 'single-primary' : ''}`}
          aria-haspopup="dialog" onClick={s.upgrade}>
          <Download aria-hidden />{planCopy.upgradeToDownload}
        </button>
        <button type="button" className="btn btn-ghost btn-sm split-plain" onClick={() => (mobile ? sharePlain() : getPlain())}>{QR_COPY.withoutLogo}</button>
      </div>
    )
  }
  const menuItems = others.map((f) => (
    <button key={f.id} type="button" role="menuitem" onClick={() => { setMenu(false); get(f.id) }}>
      <Download aria-hidden />
      <span><b style={{ fontWeight: 600 }}>Download {f.label}</b><br /><span className="muted xs">{f.help}</span></span>
    </button>
  ))
  return (
    <div className="split split-out">
      <button ref={primaryRef} type="button" className={`btn ${upgradePrimary ? 'btn-black' : 'btn-secondary'} btn-sm split-main ${primaryRef ? "single-primary" : ""}`}
        aria-label={mobile ? `Save ${label} image` : `Download ${label} as PNG`} onClick={() => (mobile ? share() : get('png'))}>
        {mobile ? <Share aria-hidden /> : <Download aria-hidden />}{mobile ? QR_COPY.saveOrShare : QR_COPY.downloadPng}
      </button>
      <button ref={caret} type="button" className={`btn ${upgradePrimary ? 'btn-black' : 'btn-secondary'} btn-sm split-caret`} aria-label={QR_COPY.otherFormats}
        aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}><ChevronDown aria-hidden /></button>
      <PopMenu open={menu} anchor={caret} onClose={() => setMenu(false)} label={QR_COPY.otherFormats} width={280}>{menuItems}</PopMenu>
    </div>
  )
}

/**
 * Downloads for a row of codes: PNG on the row, SVG and PDF in its More options menu. No animation, an alert at the
 * bottom. Free with a logo in can't download: each one opens the plans pop-up instead.
 */
export function useQrFiles(refId: string) {
  const s = useStore()
  const opts = useQrOptions(refId)
  const locked = s.plan !== 'pro' && !!s.settings.style.logo
  const get = async (f: QrFormat) => {
    if (locked) { s.upgrade(); return }
    download(await fileFor(opts, f), fileName(refId, f))
    if (refId === MAIN_QR) tick('download-main')
    s.markDownloaded()
    s.toast(QR_COPY.downloadedAs(f), QR_ALERT)
  }
  return { get, locked }
}

/** The code itself, as big as the view allows. A phone can show it full screen. */
function CodePreview({ refId }: { refId: string }) {
  const mobile = useIsMobile()
  const opts = useQrOptions(refId)
  const [full, setFull] = useState(false)
  return (
    <div className="qr-focus">
      <div className="qr-print">
        <img className="qr-img" src={svgSrc(buildSvg(opts, { tight: true }))} alt={`QR code that opens ${opts.url.replace('https://', '')}`} />
      </div>
      {mobile && (
        <button type="button" className="btn btn-secondary btn-sm icon-btn qr-full-btn" aria-label="Show full screen" onClick={() => setFull(true)}><Maximize2 aria-hidden /></button>
      )}
      {full && <FullQr url={opts.url} caption={opts.shortLink} style={opts.style} onClose={() => setFull(false)} />}
    </div>
  )
}

/**
 * One code up close, in this order: the code with its link line, Download (the black primary here, since Copy
 * isn't on screen), the logo, and the tracking line. In the share sheet it is a detail view; elsewhere, its own
 * dialog. `focusLogo`: opened from Customize QR code, so it scrolls to the logo and focuses it.
 */
export function QrDetail({ refId, focusLogo = false }: { refId: string; focusLogo?: boolean }) {
  const s = useStore()
  const { settings, setSettings } = s
  const { style } = settings
  const file = useRef<HTMLInputElement>(null)
  const upload = useRef<HTMLButtonElement>(null)
  const head = useRef<HTMLHeadingElement>(null)
  const placement = s.placements.find((p) => p.ref === refId)
  const setLogo = (logo: string | null) => setSettings({ ...settings, style: { ...style, logo } })
  const onLogo = (f?: File) => {
    if (!f) return
    const r = new FileReader()
    r.onload = async () => {
      const url = String(r.result)
      if (isLogoData(url) && await logoLoads(url)) setLogo(url)
      else s.toast(QR_COPY.logoUnreadable)
    }
    r.readAsDataURL(f)
  }
  useEffect(() => {
    if (!focusLogo) return
    // After the view's own focus move, so this one wins.
    const t = window.setTimeout(() => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      head.current?.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' })
      head.current?.focus({ preventScroll: true })
    }, 80)
    return () => window.clearTimeout(t)
  }, [focusLogo])
  return (
    <div className="qr-detail">
      {/* The code, its link and Download read as one group. */}
      <div className="qr-detail-group">
        <CodePreview refId={refId} />
        <div className="qr-detail-dl">
          <DownloadSplit refId={refId} label={placement?.label ?? QR_COPY.yourCode} upgradePrimary />
        </div>
      </div>
      {/* The logo control right under Download, 24px down, with its Pro badge on the label. A logo shows in the code straight away. */}
      {/* One logo for the whole form. Free can try it: it shows right away, and downloading it is Pro. */}
      <section className="qr-logo" aria-labelledby="qr-logo-h">
        <div className="row-between logo-row">
          <span className="stack gap-4">
            <h3 ref={head} id="qr-logo-h" className="qr-section-title field-label" tabIndex={-1} data-row="logo-section">{QR_COPY.logo} <Pro /></h3>
            <span className="xs muted">{QR_COPY.logoHelp}</span>
          </span>
          <div className="row gap-8">
            {style.logo && <button type="button" className="btn btn-ghost btn-sm" aria-label="Remove logo" onClick={() => { setLogo(null); requestAnimationFrame(() => upload.current?.focus()) }}>Remove</button>}
            <button ref={upload} type="button" className="btn btn-secondary btn-sm" aria-label={style.logo ? 'Replace logo' : 'Upload logo'} onClick={() => file.current?.click()}><Upload aria-hidden />{style.logo ? 'Replace' : 'Upload'}</button>
            <input ref={file} type="file" accept="image/png,image/jpeg,image/svg+xml" hidden onChange={(e) => { onLogo(e.target.files?.[0]); e.target.value = '' }} />
          </div>
        </div>
      </section>
    </div>
  )
}

/** Insights with the QR rows lit up, in the same version you're looking at. */
export const insightsQrHref = () => screenHref('/insights', '?focus=qr')

export const SUGGESTED = ['Poster', 'Flyer', 'Slides', 'Newspaper']

/** The same add input everywhere: it asks for a place name, never a ref. */
export function AddPlace({ label, onAdd, placeholder = 'Place name, like Poster or Library' }: { label: string; onAdd: (name: string) => void; placeholder?: string }) {
  const [name, setName] = useState('')
  const field = useRef<HTMLInputElement>(null)
  return (
    <form className="row gap-8 add-place" onSubmit={(e) => { e.preventDefault(); if (!name.trim()) return; field.current?.focus({ preventScroll: true }); onAdd(name.trim()); setName('') }}>
      <input ref={field} className="input" style={{ flex: 1 }} aria-label={label} placeholder={placeholder} value={name} onChange={(e) => setName(e.target.value)} />
      <button type="submit" className="btn btn-secondary" disabled={!name.trim()}><Plus aria-hidden />Add</button>
    </form>
  )
}

export const qrTitle = (label: string | undefined, ref: string) => (label && ref !== MAIN_QR ? `QR Code for ${label}` : QR_COPY.yourCode)

/** Outside the share sheet (Insights, a link with ?qr), a code opens in its own dialog. */
export function QrPanel() {
  const s = useStore()
  const placement = s.placements.find((p) => p.ref === s.qrRef)
  const [round, setRound] = useState(0)
  useEffect(() => { if (!s.qrOpen) { s.setQrPersonalize(false); setRound((n) => n + 1) } }, [s.qrOpen]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Dialog open={s.qrOpen} onClose={() => s.setQrOpen(false)} title={qrTitle(placement?.label, s.qrRef)} width={400} snap="full" labelledBy="qr-title">
      <QrDetail key={`${round}-${s.qrRef}`} refId={s.qrRef} focusLogo={s.qrPersonalize} />
    </Dialog>
  )
}

function FullQr({ url, caption, style, onClose }: { url: string; caption: string; style: QrStyle; onClose: () => void }) {
  const btn = useRef<HTMLButtonElement>(null)
  useEffect(() => { btn.current?.focus() }, [])
  return (
    <div className="full-qr" role="dialog" aria-modal="true" aria-label="QR code, full screen">
      <button ref={btn} type="button" className="btn btn-ghost icon-btn full-close" style={{ width: 44, height: 44 }} onClick={onClose} aria-label="Close"><X aria-hidden /></button>
      <img src={svgSrc(codeSvg(url, style))} alt={`QR code that opens ${url}`} />
      <div className="qr-shortlink" style={{ fontSize: 22 }}>{caption}</div>
      <a className="small egg" href={EASTER_EGG} target="_blank" rel="noreferrer">{EGG_TITLE}</a>
    </div>
  )
}
