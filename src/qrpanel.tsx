import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Download, Maximize2, Share, X, Palette, Upload } from 'lucide-react'
import { EASTER_EGG, FORM_TITLE, MAIN_QR, qrUrl, canNativeShare, slugify, useIsMobile, useStore } from './store'
import { tick } from './guide'
import { Collapse, Dialog, Menu, Segmented, Pro, Switch, UpgradeButton } from './ui'
import { buildSvg, codeSvg, contrastOnWhite, download, fileFor, pngBlob, svgSrc, type QrFormat, type QrOptions, type QrStyle } from './qr'

export const FORMATS: { id: QrFormat; label: string; help: string }[] = [
  { id: 'svg', label: 'SVG', help: 'Sharp at any size. Best for print.' },
  { id: 'pdf', label: 'PDF', help: 'Ready to print' },
  { id: 'png', label: 'PNG', help: 'PNG works best in Canva, Word and Slides' },
]

export const fileName = (ref: string, ext: string) => `${slugify(FORM_TITLE)}-${ref}.${ext}`

/** Keeps a too-light brand color from breaking the scan. */
export function safeStyle(st: QrStyle): QrStyle {
  return st.mode === 'brand' && contrastOnWhite(st.color) < 3 ? { ...st, color: '#000000' } : st
}

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

export const QR_COPY = {
  downloadPng: 'Download PNG',
  saveOrShare: 'Save or share',
  otherFormats: 'Other formats',
  downloaded: 'QR code downloaded. Time to print!',
  showLink: 'Show link under code',
  logoHelp: 'Your logo replaces the Tally mark in the middle.',
}

export function useQrOptions(ref: string): QrOptions {
  const s = useStore()
  return { url: qrUrl(ref), shortLink: s.shortLink, style: safeStyle(s.settings.style), showLink: s.settings.showLink }
}

export function QrPanel() {
  const s = useStore()
  const mobile = useIsMobile()
  const { settings, setSettings } = s
  const { style } = settings
  const [personalize, setPersonalize] = useState(false)
  const [hex, setHex] = useState(style.color)
  const [menu, setMenu] = useState(false)
  const [printing, setPrinting] = useState(0)
  const [full, setFull] = useState(false)
  const file = useRef<HTMLInputElement>(null)
  // On Free you can try a color and logo here, but they are only a draft until you upgrade.
  const [draft, setDraft] = useState<QrStyle | null>(null)
  const pro = s.plan === 'pro'
  const shown = draft ?? style
  useEffect(() => {
    if (!s.qrOpen) { setPersonalize(false); setMenu(false); setDraft(null); s.setQrPersonalize(false) }
    else if (s.qrPersonalize) setPersonalize(true)
  }, [s.qrOpen]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setHex(shown.color) }, [shown.color])

  const ref = s.qrRef
  const placement = s.placements.find((p) => p.ref === ref)
  const opts = useQrOptions(ref)
  const previewOpts = { ...opts, style: safeStyle(shown) }
  const lowContrast = shown.mode === 'brand' && contrastOnWhite(shown.color) < 3
  const setStyle = (p: Partial<QrStyle>) => (pro ? setSettings({ ...settings, style: { ...style, ...p } }) : setDraft({ ...shown, ...p }))
  const unsaved = !pro && draft !== null && draft.mode === 'brand'

  const doDownload = async (f: QrFormat) => {
    if (ref === MAIN_QR) tick('download-main')
    setPrinting((n) => n + 1)
    download(await fileFor(opts, f), fileName(ref, f))
    s.markDownloaded()
    s.toast('QR code downloaded. Time to print!')
  }

  const shareFile = async () => {
    setPrinting((n) => n + 1)
    s.markDownloaded()
    if (ref === MAIN_QR) tick('download-main')
    const r = await saveOrShare(opts, ref)
    if (r === 'downloaded') s.toast(QR_COPY.downloaded)
  }

  const onLogo = (f?: File) => {
    if (!f) return
    const r = new FileReader()
    r.onload = () => setStyle({ mode: 'brand', logo: String(r.result) })
    r.readAsDataURL(f)
  }

  const preview = (
    <div className="qr-focus">
      <div className={`qr-print ${printing ? 'is-printing' : ''}`} key={printing}>
        <img className="qr-img" src={svgSrc(buildSvg(previewOpts))} alt={`QR code that opens ${s.display()}`} />
      </div>
      {mobile && (
        <button type="button" className="btn btn-secondary btn-sm icon-btn qr-full-btn" aria-label="Show full screen" onClick={() => setFull(true)}><Maximize2 aria-hidden /></button>
      )}
    </div>
  )

  const downloadControl = (
    <div className="split" style={{ position: 'relative', flex: 1 }}>
      <button type="button" className="btn btn-black split-main" onClick={() => doDownload('png')}><Download aria-hidden />{QR_COPY.downloadPng}</button>
      <button type="button" className="btn btn-black split-caret" aria-label={QR_COPY.otherFormats} aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}><ChevronDown aria-hidden /></button>
      <Menu open={menu} onClose={() => setMenu(false)} style={{ top: 42, left: 0, width: 280 }}>
        {FORMATS.filter((f) => f.id !== 'png').map((f) => (
          <button key={f.id} role="menuitem" onClick={() => { setMenu(false); doDownload(f.id) }}>
            <Download aria-hidden />
            <span><b style={{ fontWeight: 600 }}>Download {f.label}</b><br /><span className="muted xs">{f.help}</span></span>
          </button>
        ))}
      </Menu>
    </div>
  )

  const personalizeBtn = (
    <button type="button" className={`btn btn-secondary ${mobile ? 'btn-lg btn-block' : ''}`} aria-expanded={personalize} aria-controls="qr-personalize" onClick={() => setPersonalize((v) => !v)}>
      <Palette aria-hidden />Personalize
    </button>
  )

  const body = (
    <div className="stack gap-16">
      {preview}
      {mobile
        ? <>
          {personalizeBtn}
          <div className="row gap-8" style={{ justifyContent: 'center' }}>
            {FORMATS.filter((f) => f.id !== 'png').map((f) => (
              <button key={f.id} type="button" className="link-btn small" onClick={() => doDownload(f.id)}>Download {f.label}</button>
            ))}
          </div>
        </>
        : <div className="row gap-8">{downloadControl}{personalizeBtn}</div>}
      <Collapse open={personalize} gap={16}>
        <div className="personalize stack gap-12" id="qr-personalize">
          <div className="row-between">
            <label className="field-label" htmlFor="qr-show-link">{QR_COPY.showLink}</label>
            <Switch id="qr-show-link" checked={settings.showLink} label={QR_COPY.showLink} onChange={(v) => setSettings({ ...settings, showLink: v })} />
          </div>
          <Segmented label="Style" value={shown.mode} onChange={(m) => setStyle({ mode: m })}
            options={[{ value: 'tally', label: 'Black' }, { value: 'brand', label: <>Your brand <Pro /></> }]} />
          {shown.mode === 'brand' && (
            <>
              <div className="row-between">
                <span className="field-label">Color</span>
                <div className="row gap-8">
                  <input type="color" value={shown.color} onChange={(e) => setStyle({ color: e.target.value })} aria-label="Brand color" className="swatch" />
                  <input className="input" value={hex} onChange={(e) => { setHex(e.target.value); if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) setStyle({ color: e.target.value }) }} aria-label="Brand color hex" style={{ width: 100 }} />
                </div>
              </div>
              {lowContrast && <span className="xs" style={{ color: 'var(--danger)' }}>That shade is too light to scan reliably, so we'll keep it black. Try a darker one.</span>}
              <div className="row-between">
                <span className="stack"><span className="field-label">Logo</span><span className="xs muted">{QR_COPY.logoHelp}</span></span>
                <div className="row gap-8">
                  {shown.logo && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStyle({ logo: null })}>Remove</button>}
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => file.current?.click()}><Upload aria-hidden />{shown.logo ? 'Replace' : 'Upload'}</button>
                  <input ref={file} type="file" accept="image/png,image/jpeg,image/svg+xml" hidden onChange={(e) => onLogo(e.target.files?.[0])} />
                </div>
              </div>
            </>
          )}
          {unsaved && (
            <div className="row gap-8" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDraft(null)}>Cancel</button>
              <UpgradeButton onClick={s.upgrade} />
            </div>
          )}
        </div>
      </Collapse>
      <p className="xs muted" style={{ margin: 0, textAlign: 'center' }}>Responses from this code are tagged, so you'll see where they came from.</p>
    </div>
  )

  const footer = mobile ? (
    <div className="row gap-8">
      <button type="button" className="btn btn-black btn-lg" style={{ flex: 1 }} onClick={shareFile}><Share aria-hidden />{QR_COPY.saveOrShare}</button>
    </div>
  ) : undefined

  const title = placement && ref !== 'qr' ? `QR Code for ${placement.label}` : 'QR Code'
  return (
    <>
      <Dialog open={s.qrOpen} onClose={() => s.setQrOpen(false)} title={title} width={400} snap="full" footer={footer} labelledBy="qr-title">
        {body}
      </Dialog>
      {full && <FullQr url={opts.url} style={opts.style} onClose={() => setFull(false)} />}
    </>
  )
}

function FullQr({ url, style, onClose }: { url: string; style: QrStyle; onClose: () => void }) {
  const s = useStore()
  const btn = useRef<HTMLButtonElement>(null)
  useEffect(() => { btn.current?.focus() }, [])
  return (
    <div className="full-qr" role="dialog" aria-modal="true" aria-label="QR code, full screen">
      <button ref={btn} type="button" className="btn btn-ghost icon-btn full-close" style={{ width: 44, height: 44 }} onClick={onClose} aria-label="Close"><X aria-hidden /></button>
      <img src={svgSrc(codeSvg(url, style))} alt={`QR code that opens ${url}`} />
      <div className="qr-shortlink" style={{ fontSize: 22 }}>{s.shortLink}</div>
      <a className="small egg" href={EASTER_EGG} target="_blank" rel="noreferrer">Look ma, no typing.</a>
    </div>
  )
}
