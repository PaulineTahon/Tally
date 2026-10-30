import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Download, ExternalLink, Maximize2, Share, ImageDown, TriangleAlert, X, Check } from 'lucide-react'
import { EASTER_EGG, FORM_TITLE, canNativeShare, useIsMobile, useStore } from './store'
import { Dialog, Menu, Segmented, Switch } from './ui'
import { buildSvg, contrastOnWhite, download, pdfBlob, pngBlob, SIZES, type QrSize } from './qr'

type Format = 'svg' | 'pdf' | 'png'
const FORMATS: { id: Format; label: string; help: string }[] = [
  { id: 'svg', label: 'SVG', help: 'Sharp at any size. Best for print.' },
  { id: 'pdf', label: 'PDF', help: 'Ready to print' },
  { id: 'png', label: 'PNG', help: 'PNG works best in Canva, Word and Slides' },
]
const BRAND = '#6B3FD6'

export function QrPanel() {
  const s = useStore()
  const mobile = useIsMobile()
  const [colorMode, setColorMode] = useState<'black' | 'brand'>('black')
  const [brand, setBrand] = useState(BRAND)
  const [hex, setHex] = useState(BRAND)
  const [logo, setLogo] = useState(false)
  const [size, setSize] = useState<QrSize>('medium')
  const [format, setFormat] = useState<Format>('svg')
  const [menu, setMenu] = useState(false)
  const [styleOpen, setStyleOpen] = useState(false)
  const [printing, setPrinting] = useState(0)
  const [full, setFull] = useState(false)

  const ref = s.trackQr ? s.qrRef : undefined
  const url = s.url(ref)
  const shown = s.display(ref)
  const lowContrast = colorMode === 'brand' && contrastOnWhite(brand) < 4.5
  const color = colorMode === 'black' ? '#000000' : lowContrast ? '#000000' : brand
  const opts = { url, shortLink: s.shortLink, color, logo, madeWithTally: true }
  const name = `${FORM_TITLE.toLowerCase().replace(/\s+/g, '-')}-qr${ref && ref !== 'qr' ? `-${ref}` : ''}`

  const print = () => setPrinting((n) => n + 1)
  const doDownload = async (f: Format) => {
    print()
    if (f === 'svg') download(new Blob([buildSvg(opts)], { type: 'image/svg+xml' }), `${name}.svg`)
    if (f === 'pdf') download(await pdfBlob(opts, size), `${name}.pdf`)
    if (f === 'png') download(await pngBlob(opts, size === 'small' ? 2 : size === 'medium' ? 4 : 8), `${name}.png`)
    s.markDownloaded()
    s.toast('QR code downloaded. Time to print!')
  }

  const shareFile = async (mode: 'save' | 'share') => {
    const blob = await pngBlob(opts, 4)
    const file = new File([blob], `${name}.png`, { type: 'image/png' })
    print()
    s.markDownloaded()
    if (canNativeShare() && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share(mode === 'save' ? { files: [file] } : { files: [file], title: FORM_TITLE, url })
        if (mode === 'save') s.toast('Saved to your photos.')
      } catch { /* closed */ }
      return
    }
    download(blob, `${name}.png`)
    s.toast(mode === 'save' ? 'Saved to your photos.' : 'QR code downloaded. Time to print!')
  }

  const changed = s.downloadedLink && s.downloadedLink !== s.shortLink

  const preview = (
    <div className="qr-preview card">
      <div className={`qr-print ${printing ? 'is-printing' : ''}`} key={printing}>
        <img
          className="qr-img"
          src={'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(buildSvg({ ...opts, madeWithTally: false }, { caption: false }))}
          alt={`QR code that opens ${shown}`}
        />
      </div>
      <div className="qr-shortlink">{s.shortLink}</div>
      <div className="xs muted">For anyone who'd rather type.</div>
      <div className="qr-mark xs"><span>Made with Tally</span><span className="muted">Remove it with Pro</span></div>
    </div>
  )

  const downloadControl = mobile ? null : (
    <div className="split" style={{ position: 'relative' }}>
      <button type="button" className="btn btn-black split-main" onClick={() => doDownload(format)}><Download aria-hidden />Download {format.toUpperCase()}</button>
      <button type="button" className="btn btn-black split-caret" aria-label="Choose a format" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}><ChevronDown aria-hidden /></button>
      <Menu open={menu} onClose={() => setMenu(false)} style={{ top: 42, right: 0, width: 280 }}>
        {FORMATS.map((f) => (
          <button key={f.id} role="menuitemradio" aria-checked={format === f.id} onClick={() => { setFormat(f.id); setMenu(false); doDownload(f.id) }}>
            {format === f.id ? <Check aria-hidden /> : <span style={{ width: 16 }} />}
            <span><b style={{ fontWeight: 600 }}>{f.label}</b><br /><span className="muted xs">{f.help}</span></span>
          </button>
        ))}
      </Menu>
    </div>
  )

  const body = (
    <div className={mobile ? 'stack gap-16' : 'qr-grid'}>
      <div className="stack gap-12">
        {preview}
        <div className="scan-test">
          <div className="row-between">
            <span className="small" style={{ fontWeight: 600 }}>Scan to test</span>
            <a className="btn btn-ghost btn-sm" href={url} target="_blank" rel="noreferrer"><ExternalLink aria-hidden />Open the link</a>
          </div>
          <span className="xs muted">Point your phone camera at the code. <a href={EASTER_EGG} target="_blank" rel="noreferrer" className="egg">Look ma, no typing.</a></span>
        </div>
        {mobile && <button type="button" className="btn btn-secondary btn-lg" onClick={() => setFull(true)}><Maximize2 aria-hidden />Show QR</button>}
      </div>
      <div className="stack gap-16">
        {downloadControl}
        {!mobile && <p className="xs muted" style={{ margin: '-8px 0 0' }}>{FORMATS.find((f) => f.id === format)!.help}</p>}

        {changed && (
          <div className="callout callout-warn" role="alert">
            <TriangleAlert aria-hidden />
            <span>This code points to <b>{s.shortLink}</b>. Codes you printed before still point to <b>{s.downloadedLink}</b>, which no longer opens your form.</span>
          </div>
        )}

        <div className="stack gap-4">
          <div className="row-between">
            <label htmlFor="track-qr" style={{ fontSize: 15, fontWeight: 500 }}>Track responses from QR</label>
            <Switch id="track-qr" label="Track responses from QR" checked={s.trackQr} onChange={s.setTrackQr} />
          </div>
          <span className="xs muted">Adds ?ref={s.qrRef} to the link, so you can see which responses came from your code.</span>
          {s.trackQr && <code className="mono-chip">{shown}</code>}
        </div>

        <hr className="divider" />

        <div className="stack gap-12">
          <button type="button" className="disclosure" aria-expanded={styleOpen} onClick={() => setStyleOpen((v) => !v)}>
            <span><span style={{ fontWeight: 600 }}>Style</span><span className="muted xs" style={{ marginLeft: 8 }}>
              {colorMode === 'black' ? 'Black' : 'Brand colour'}, {logo ? 'logo' : 'no logo'}, {SIZES[size].label.toLowerCase()}
            </span></span>
            <ChevronDown aria-hidden style={{ transform: styleOpen ? 'rotate(180deg)' : undefined }} />
          </button>
          {styleOpen && (
            <div className="stack gap-12">
              <div className="stack gap-8">
                <span className="field-label">Colour</span>
                <Segmented label="Colour" value={colorMode} onChange={setColorMode} options={[{ value: 'black', label: 'Black' }, { value: 'brand', label: 'Brand colour' }]} />
                {colorMode === 'brand' && (
                  <div className="row gap-8">
                    <input type="color" value={brand} onChange={(e) => { setBrand(e.target.value); setHex(e.target.value) }} aria-label="Brand colour" className="swatch" />
                    <input className="input" value={hex} onChange={(e) => { setHex(e.target.value); if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) setBrand(e.target.value) }} aria-label="Brand colour hex" style={{ width: 110 }} />
                  </div>
                )}
                {lowContrast && <span className="xs" style={{ color: 'var(--danger)' }}>That shade is too light to scan reliably, so we'll keep it black. Try a darker one.</span>}
              </div>
              <div className="row-between">
                <label htmlFor="qr-logo" style={{ fontSize: 15 }}>Add logo in the middle</label>
                <Switch id="qr-logo" label="Add logo in the middle" checked={logo} onChange={setLogo} />
              </div>
              <div className="stack gap-8">
                <span className="field-label">Size</span>
                <Segmented label="Size" value={size} onChange={setSize}
                  options={(Object.keys(SIZES) as QrSize[]).map((k) => ({ value: k, label: <span className="stack" style={{ lineHeight: 1.1 }}>{SIZES[k].label}<span className="seg-hint">{SIZES[k].hint}</span></span> }))} />
                <span className="xs muted">{SIZES[size].mm / 10} cm wide when printed from the PDF.</span>
              </div>
            </div>
          )}
        </div>

        <hr className="divider" />
        <RespondentView link={shown} tracked={s.trackQr} />
      </div>
    </div>
  )

  const footer = mobile ? (
    <div className="row gap-8">
      <button type="button" className="btn btn-black btn-lg" style={{ flex: 1 }} onClick={() => shareFile('save')}><ImageDown aria-hidden />Save to photos</button>
      <button type="button" className="btn btn-secondary btn-lg" style={{ flex: 1 }} onClick={() => shareFile('share')}><Share aria-hidden />Share</button>
    </div>
  ) : (
    <button type="button" className="btn btn-secondary" onClick={() => s.setQrOpen(false)}>Done</button>
  )

  return (
    <>
      <Dialog open={s.qrOpen} onClose={() => s.setQrOpen(false)} title={<span className="stack"><span>QR code</span><span className="xs muted" style={{ fontWeight: 400 }}>Print it, stick it, share it.</span></span>} width={700} snap="full" footer={footer} labelledBy="qr-title">
        {body}
      </Dialog>
      {full && <FullQr url={url} color={color} logo={logo} onClose={() => setFull(false)} />}
    </>
  )
}

/** The thank-you screen someone sees after scanning and submitting. */
function RespondentView({ link, tracked }: { link: string; tracked: boolean }) {
  return (
    <div className="stack gap-8">
      <div className="row-between">
        <span style={{ fontSize: 15, fontWeight: 500 }}>Respondent view</span>
        <span className="xs muted">{tracked ? 'After scanning your code' : 'After opening your link'}</span>
      </div>
      <div className="respondent">
        <div className="phone-mini phone-ty" aria-label="Preview of the thank-you screen">
          <div className="phone-bar">{link}</div>
          <div className="ty-body">
            <span className="ty-emoji" aria-hidden>🧺</span>
            <b>Thanks, you're on the list!</b>
            <span>See you at the picnic.</span>
          </div>
          <div className="ty-foot">
            <span>Made with Tally</span>
            <a href="https://tally.so" target="_blank" rel="noreferrer">{tracked ? 'Make a QR form like this' : 'Make a form like this'}</a>
          </div>
        </div>
        <span className="xs muted">The small "Made with Tally" line stays below your content. People who scanned get a link to make a QR form of their own.</span>
      </div>
    </div>
  )
}

function FullQr({ url, color, logo, onClose }: { url: string; color: string; logo: boolean; onClose: () => void }) {
  const s = useStore()
  const btn = useRef<HTMLButtonElement>(null)
  useEffect(() => { btn.current?.focus() }, [])
  return (
    <div className="full-qr" role="dialog" aria-modal="true" aria-label="QR code, full screen">
      <button ref={btn} type="button" className="btn btn-ghost icon-btn full-close" style={{ width: 44, height: 44 }} onClick={onClose} aria-label="Close"><X aria-hidden /></button>
      <img src={'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(buildSvg({ url, shortLink: '', color, logo, madeWithTally: false }, { caption: false }))} alt={`QR code that opens ${url}`} />
      <div className="qr-shortlink" style={{ fontSize: 22 }}>{s.shortLink}</div>
      <div className="small muted">Look ma, no typing.</div>
    </div>
  )
}
