import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Download, Maximize2, Share, ImageDown, X, Check, Palette, Upload } from 'lucide-react'
import { EASTER_EGG, FORM_TITLE, canNativeShare, slugify, useIsMobile, useStore } from './store'
import { Collapse, Dialog, Menu, Segmented } from './ui'
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

export function useQrOptions(ref: string): QrOptions {
  const s = useStore()
  return { url: s.url(ref), shortLink: s.shortLink, style: safeStyle(s.settings.style), madeWithTally: true }
}

export function QrPanel() {
  const s = useStore()
  const mobile = useIsMobile()
  const { settings, setSettings } = s
  const { style, format } = settings
  const [personalize, setPersonalize] = useState(false)
  const [hex, setHex] = useState(style.color)
  const [menu, setMenu] = useState(false)
  const [printing, setPrinting] = useState(0)
  const [full, setFull] = useState(false)
  const file = useRef<HTMLInputElement>(null)
  useEffect(() => { if (!s.qrOpen) { setPersonalize(false); setMenu(false) } }, [s.qrOpen])
  useEffect(() => { setHex(style.color) }, [style.color])

  const ref = s.qrRef
  const placement = s.placements.find((p) => p.ref === ref)
  const opts = useQrOptions(ref)
  const lowContrast = style.mode === 'brand' && contrastOnWhite(style.color) < 3
  const setStyle = (p: Partial<QrStyle>) => setSettings({ ...settings, style: { ...style, ...p } })

  const doDownload = async (f: QrFormat) => {
    setPrinting((n) => n + 1)
    setSettings({ ...settings, format: f })
    download(await fileFor(opts, f), fileName(ref, f))
    s.markDownloaded()
    s.toast('QR code downloaded. Time to print!')
  }

  const shareFile = async (mode: 'save' | 'share') => {
    const blob = await pngBlob(opts)
    const f = new File([blob], fileName(ref, 'png'), { type: 'image/png' })
    setPrinting((n) => n + 1)
    s.markDownloaded()
    if (canNativeShare() && navigator.canShare?.({ files: [f] })) {
      try {
        await navigator.share(mode === 'save' ? { files: [f] } : { files: [f], title: FORM_TITLE, url: opts.url })
        if (mode === 'save') s.toast('Saved to your photos.')
      } catch { /* closed */ }
      return
    }
    download(blob, fileName(ref, 'png'))
    s.toast(mode === 'save' ? 'Saved to your photos.' : 'QR code downloaded. Time to print!')
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
        <img className="qr-img" src={svgSrc(buildSvg(opts))} alt={`QR code that opens ${s.display()}`} />
      </div>
      {mobile && (
        <button type="button" className="btn btn-secondary btn-sm icon-btn qr-full-btn" aria-label="Show full screen" onClick={() => setFull(true)}><Maximize2 aria-hidden /></button>
      )}
    </div>
  )

  const downloadControl = (
    <div className="split" style={{ position: 'relative', flex: 1 }}>
      <button type="button" className="btn btn-black split-main" onClick={() => doDownload(format)}><Download aria-hidden />Download {format.toUpperCase()}</button>
      <button type="button" className="btn btn-black split-caret" aria-label="Choose a format" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}><ChevronDown aria-hidden /></button>
      <Menu open={menu} onClose={() => setMenu(false)} style={{ top: 42, left: 0, width: 280 }}>
        {FORMATS.map((f) => (
          <button key={f.id} role="menuitemradio" aria-checked={format === f.id} onClick={() => { setMenu(false); doDownload(f.id) }}>
            {format === f.id ? <Check aria-hidden /> : <span style={{ width: 16 }} />}
            <span><b style={{ fontWeight: 600 }}>{f.label}</b><br /><span className="muted xs">{f.help}</span></span>
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
        ? personalizeBtn
        : <div className="row gap-8">{downloadControl}{personalizeBtn}</div>}
      <Collapse open={personalize} gap={16}>
        <div className="personalize stack gap-12" id="qr-personalize">
          <Segmented label="Style" value={style.mode} onChange={(m) => setStyle({ mode: m })}
            options={[{ value: 'tally', label: 'Black' }, { value: 'brand', label: 'Your brand' }]} />
          {style.mode === 'brand' && (
            <>
              <div className="row-between">
                <span className="field-label">Color</span>
                <div className="row gap-8">
                  <input type="color" value={style.color} onChange={(e) => setStyle({ color: e.target.value })} aria-label="Brand color" className="swatch" />
                  <input className="input" value={hex} onChange={(e) => { setHex(e.target.value); if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) setStyle({ color: e.target.value }) }} aria-label="Brand color hex" style={{ width: 100 }} />
                </div>
              </div>
              {lowContrast && <span className="xs" style={{ color: 'var(--danger)' }}>That shade is too light to scan reliably, so we'll keep it black. Try a darker one.</span>}
              <div className="row-between">
                <span className="field-label">Logo</span>
                <div className="row gap-8">
                  {style.logo && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStyle({ logo: null })}>Remove</button>}
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => file.current?.click()}><Upload aria-hidden />{style.logo ? 'Replace' : 'Upload'}</button>
                  <input ref={file} type="file" accept="image/png,image/jpeg,image/svg+xml" hidden onChange={(e) => onLogo(e.target.files?.[0])} />
                </div>
              </div>
            </>
          )}
        </div>
      </Collapse>
      <p className="xs muted" style={{ margin: 0, textAlign: 'center' }}>Responses from this code are tagged, so you'll see where they came from.</p>
    </div>
  )

  const footer = mobile ? (
    <div className="row gap-8">
      <button type="button" className="btn btn-black btn-lg" style={{ flex: 1 }} onClick={() => shareFile('save')}><ImageDown aria-hidden />Save to photos</button>
      <button type="button" className="btn btn-secondary btn-lg" style={{ flex: 1 }} onClick={() => shareFile('share')}><Share aria-hidden />Share</button>
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
