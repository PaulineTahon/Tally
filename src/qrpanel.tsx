import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Download, Maximize2, Share, X, SlidersHorizontal, Upload } from 'lucide-react'
import { EASTER_EGG, QR_CAPTION, FORM_TITLE, MAIN_QR, qrUrl, canNativeShare, slugify, useIsMobile, useStore } from './store'
import { tick } from './guide'
import { EGG_TITLE } from './copy'
import { ActionRow, Collapse, Dialog, PopMenu, Switch, UpgradeButton } from './ui'
import { buildSvg, codeSvg, download, fileFor, pngBlob, svgSrc, type QrFormat, type QrOptions, type QrStyle } from './qr'

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
export const QR_ALERT = { top: true, group: 'qr', duration: 4000 }

export const QR_COPY = {
  yourCode: 'Your QR Code',
  downloadPng: 'Download PNG',
  saveOrShare: 'Save image',
  otherFormats: 'Other formats',
  moreFormats: 'More formats',
  readyLine: 'Ready to print. Add it to a poster, flyer or slide.',
  downloadedAs: (f: QrFormat) => `${f.toUpperCase()} downloaded`,
  imageSaved: 'Image saved',
  showLink: 'Show link under code',
  logo: 'Add your logo',
  logoHelp: "Put your logo in the middle instead of the Tally mark. Codes stay black so they're easy to scan.",
}

export function useQrOptions(ref: string): QrOptions {
  const s = useStore()
  return { url: qrUrl(ref), shortLink: QR_CAPTION, style: s.settings.style, showLink: s.settings.showLink }
}

/**
 * Download as one split button, the same in the QR Code tab and in the QR detail: PNG (or Save image on a phone)
 * on the main part, SVG and PDF in a menu that renders above the sheet, never clipped by it.
 */
export function DownloadSplit({ refId, label, onDone, primaryRef }: { refId: string; label: string; onDone?: () => void; primaryRef?: React.Ref<HTMLButtonElement> }) {
  const s = useStore()
  const mobile = useIsMobile()
  const opts = useQrOptions(refId)
  const [menu, setMenu] = useState(false)
  const caret = useRef<HTMLButtonElement>(null)
  const after = () => { if (refId === MAIN_QR) tick('download-main'); s.markDownloaded(); onDone?.() }
  const get = async (f: QrFormat) => { download(await fileFor(opts, f), fileName(refId, f)); after(); s.toast(QR_COPY.downloadedAs(f), QR_ALERT) }
  const share = async () => { after(); if ((await saveOrShare(opts, refId)) !== 'closed') s.toast(QR_COPY.imageSaved, QR_ALERT) }
  const others = FORMATS.filter((f) => (mobile ? true : f.id !== 'png'))
  return (
    <div className="split split-out">
      <button ref={primaryRef} type="button" className={`btn btn-secondary btn-sm split-main ${primaryRef ? "single-primary" : ""}`}
        aria-label={mobile ? QR_COPY.saveOrShare : `Download ${label} as PNG`} onClick={() => (mobile ? share() : get('png'))}>
        {mobile ? <Share aria-hidden /> : <Download aria-hidden />}{mobile ? QR_COPY.saveOrShare : QR_COPY.downloadPng}
      </button>
      <button ref={caret} type="button" className="btn btn-secondary btn-sm split-caret" aria-label={QR_COPY.otherFormats}
        aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}><ChevronDown aria-hidden /></button>
      <PopMenu open={menu} anchor={caret} onClose={() => setMenu(false)} label={QR_COPY.otherFormats} width={280}>
        {others.map((f) => (
          <button key={f.id} type="button" role="menuitem" onClick={() => { setMenu(false); get(f.id) }}>
            <Download aria-hidden />
            <span><b style={{ fontWeight: 600 }}>Download {f.label}</b><br /><span className="muted xs">{f.help}</span></span>
          </button>
        ))}
      </PopMenu>
    </div>
  )
}

/**
 * One code up close: the code, Download and Personalize. In the share sheet it is a detail view
 * (Back and the title in the header); elsewhere it sits in its own dialog.
 */
export function QrDetail({ refId, startPersonalize = false }: { refId: string; startPersonalize?: boolean }) {
  const s = useStore()
  const mobile = useIsMobile()
  const { settings, setSettings } = s
  const { style } = settings
  const [personalize, setPersonalize] = useState(startPersonalize)
  const [printing, setPrinting] = useState(0)
  const [full, setFull] = useState(false)
  const file = useRef<HTMLInputElement>(null)
  // On Free you can try a logo here, but it is only a draft until you upgrade.
  const [draft, setDraft] = useState<QrStyle | null>(null)
  const pro = s.plan === 'pro'
  const shown = draft ?? style
  const placement = s.placements.find((p) => p.ref === refId)
  const opts = useQrOptions(refId)
  const previewOpts = { ...opts, style: shown }
  const setStyle = (p: Partial<QrStyle>) => (pro ? setSettings({ ...settings, style: { ...style, ...p } }) : setDraft({ ...shown, ...p }))
  const unsaved = !pro && draft !== null && draft.logo !== null
  const onLogo = (f?: File) => {
    if (!f) return
    const r = new FileReader()
    r.onload = () => setStyle({ logo: String(r.result) })
    r.readAsDataURL(f)
  }
  return (
    <div className="stack gap-16">
      <div className="qr-focus">
        <div className={`qr-print ${printing ? 'is-printing' : ''}`} key={printing}>
          <img className="qr-img" src={svgSrc(buildSvg(previewOpts))} alt={`QR code that opens ${qrUrl(refId).replace('https://', '')}`} />
        </div>
        {mobile && (
          <button type="button" className="btn btn-secondary btn-sm icon-btn qr-full-btn" aria-label="Show full screen" onClick={() => setFull(true)}><Maximize2 aria-hidden /></button>
        )}
      </div>
      <div className="stack gap-8">
        <DownloadSplit refId={refId} label={placement?.label ?? QR_COPY.yourCode} onDone={() => setPrinting((n) => n + 1)} />
        <div className="act-rows">
          <ActionRow icon={<SlidersHorizontal />} label="Personalize" pro expanded={personalize} controls="qr-personalize" onClick={() => setPersonalize((v) => !v)} />
        </div>
        <Collapse open={personalize} gap={8}>
          <div className="personalize stack gap-12" id="qr-personalize">
            <div className="row-between">
              <label className="field-label" htmlFor="qr-show-link">{QR_COPY.showLink}</label>
              <Switch id="qr-show-link" checked={settings.showLink} label={QR_COPY.showLink} onChange={(v) => setSettings({ ...settings, showLink: v })} />
            </div>
            <div className="row-between">
              <span className="stack"><span className="field-label">{QR_COPY.logo}</span><span className="xs muted">{QR_COPY.logoHelp}</span></span>
              <div className="row gap-8">
                {shown.logo && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStyle({ logo: null })}>Remove</button>}
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => file.current?.click()}><Upload aria-hidden />{shown.logo ? 'Replace' : 'Upload'}</button>
                <input ref={file} type="file" accept="image/png,image/jpeg,image/svg+xml" hidden onChange={(e) => { onLogo(e.target.files?.[0]); e.target.value = '' }} />
              </div>
            </div>
            {unsaved && (
              <div className="row gap-8" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDraft(null)}>Cancel</button>
                <UpgradeButton onClick={s.upgrade} />
              </div>
            )}
          </div>
        </Collapse>
      </div>
      <p className="xs muted" style={{ margin: 0, textAlign: 'center' }}>Responses from this code are tagged, so you'll see where they came from.</p>
      {full && <FullQr url={opts.url} style={opts.style} onClose={() => setFull(false)} />}
    </div>
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
      <QrDetail key={`${round}-${s.qrRef}`} refId={s.qrRef} startPersonalize={s.qrPersonalize} />
    </Dialog>
  )
}

function FullQr({ url, style, onClose }: { url: string; style: QrStyle; onClose: () => void }) {
  const btn = useRef<HTMLButtonElement>(null)
  useEffect(() => { btn.current?.focus() }, [])
  return (
    <div className="full-qr" role="dialog" aria-modal="true" aria-label="QR code, full screen">
      <button ref={btn} type="button" className="btn btn-ghost icon-btn full-close" style={{ width: 44, height: 44 }} onClick={onClose} aria-label="Close"><X aria-hidden /></button>
      <img src={svgSrc(codeSvg(url, style))} alt={`QR code that opens ${url}`} />
      <div className="qr-shortlink" style={{ fontSize: 22 }}>{QR_CAPTION}</div>
      <a className="small egg" href={EASTER_EGG} target="_blank" rel="noreferrer">{EGG_TITLE}</a>
    </div>
  )
}
