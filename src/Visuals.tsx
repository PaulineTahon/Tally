import { useRef, useState, type ReactNode } from 'react'
import { toPng } from 'html-to-image'
import { Download, ChevronDown, Check, Copy, Palette } from 'lucide-react'
import { LOGO_RATIO, PINK as QR_PINK, QUIET, matrix, modulePath } from './qr'
import { TALLY_PATH } from './mark'
import { TallyMark } from './chrome'

/** Every visual opens the same live form, tagged by where it was seen. */
const FORM = 'https://tally.so/r/KpYalV'
export const VISUAL_URL = (ref: string) => `${FORM}?ref=${ref}`

const PINK = '#F81CE5'

/** A real, scannable code drawn as SVG, in the default Tally style: black, pink eyes, the mark in the middle. */
function Qr({ x = 0, y = 0, size, url }: { x?: number; y?: number; size: number; url: string }) {
  const m = matrix(url)
  const n = m.size + QUIET * 2
  const eyes = [[0, 0], [m.size - 7, 0], [0, m.size - 7]]
  const ls = m.size * LOGO_RATIO
  const lx = (n - ls) / 2
  const pad = ls * 0.16
  const k = (ls - pad * 2) / 128
  return (
    <g transform={`translate(${x} ${y}) scale(${size / n})`}>
      <rect width={n} height={n} fill="#fff" />
      <path d={modulePath(m)} fill="#000" shapeRendering="crispEdges" />
      {eyes.map(([ex, ey]) => (
        <g key={`${ex}-${ey}`} transform={`translate(${ex + QUIET} ${ey + QUIET})`}>
          <path d="M0 0h7v7h-7z M1 1v5h5v-5z" fill="#000" fillRule="evenodd" />
          <rect x={2} y={2} width={3} height={3} fill={QR_PINK} />
        </g>
      ))}
      <rect x={lx} y={lx} width={ls} height={ls} rx={ls * 0.22} fill="#fff" />
      <g transform={`translate(${lx + pad} ${lx + pad + (ls - pad * 2 - 124 * k) / 2}) scale(${k})`}><path d={TALLY_PATH} fill="#000" /></g>
    </g>
  )
}

/** Stand-alone code for HTML layouts. */
function QrBox({ size, url, label }: { size: number; url: string; label: string }) {
  return <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label={label}><Qr size={size} url={url} /></svg>
}

/** Deterministic wobble so the doodles look hand drawn. */
function rng(seed: number) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 } }
function wobble(points: [number, number][], seed: number, amt = 2.2, close = true) {
  const r = rng(seed)
  const pts = points.map(([x, y]) => [x + (r() - 0.5) * amt * 2, y + (r() - 0.5) * amt * 2])
  let d = `M${pts[0][0]} ${pts[0][1]}`
  for (let i = 1; i <= pts.length - (close ? 0 : 1); i++) {
    const p = pts[i % pts.length]
    const prev = pts[i - 1]
    const mx = (prev[0] + p[0]) / 2 + (r() - 0.5) * amt
    const my = (prev[1] + p[1]) / 2 + (r() - 0.5) * amt
    d += ` Q${mx} ${my} ${p[0]} ${p[1]}`
  }
  return d
}
const rect = (x: number, y: number, w: number, h: number, seed: number) => wobble([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], seed)



/* ---------- Social: 2400x1260, white, composed like Tally's own share image ---------- */
const DOODLE = '#444444'
const pen = { fill: 'none', stroke: DOODLE, strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

function circle(cx: number, cy: number, r: number, seed: number) {
  const pts: [number, number][] = []
  for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * 1.08]) }
  return wobble(pts, seed, r * 0.05)
}

/** A quick doodled face. Mood changes the mouth, hair changes the top. */
function Face({ x, y, r = 30, rot = 0, seed = 1, mood = 'smile', hair = 'curl' }: { x: number; y: number; r?: number; rot?: number; seed?: number; mood?: 'smile' | 'open' | 'flat'; hair?: 'curl' | 'spikes' | 'bun' | 'none' }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`} {...pen}>
      <path d={circle(0, 0, r, seed)} />
      <path d={`M${-r * 0.42} ${-r * 0.1}q3 -4 6 0`} />
      <path d={`M${r * 0.2} ${-r * 0.12}q3 -4 6 0`} />
      <path d={`M${-r * 0.05} ${r * 0.02}l-3 ${r * 0.22}h5`} strokeWidth={1.8} />
      {mood === 'smile' && <path d={`M${-r * 0.38} ${r * 0.42}q${r * 0.38} ${r * 0.3} ${r * 0.74} 0`} />}
      {mood === 'open' && <path d={circle(r * 0.02, r * 0.5, r * 0.14, seed + 3)} />}
      {mood === 'flat' && <path d={`M${-r * 0.3} ${r * 0.5}h${r * 0.55}`} />}
      {hair === 'curl' && <path d={`M${-r * 0.7} ${-r * 0.7}c${r * 0.2} ${-r * 0.5} ${r * 0.9} ${-r * 0.6} ${r * 1.1} ${-r * 0.1}c${r * 0.1} ${-r * 0.4} ${r * 0.5} ${-r * 0.3} ${r * 0.4} ${r * 0.1}`} />}
      {hair === 'spikes' && <path d={`M${-r * 0.6} ${-r * 0.8}l${r * 0.15} ${-r * 0.35}l${r * 0.15} ${r * 0.25}l${r * 0.2} ${-r * 0.35}l${r * 0.15} ${r * 0.3}l${r * 0.25} ${-r * 0.3}l${r * 0.1} ${r * 0.35}`} />}
      {hair === 'bun' && <path d={circle(r * 0.1, -r * 1.25, r * 0.28, seed + 7)} />}
    </g>
  )
}

function Bubble({ x, y, w, h, tail = 'left', seed = 1, children }: { x: number; y: number; w: number; h: number; tail?: 'left' | 'right'; seed?: number; children?: ReactNode }) {
  const pts: [number, number][] = []
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; pts.push([x + w / 2 + Math.cos(a) * w / 2, y + h / 2 + Math.sin(a) * h / 2]) }
  const tx = tail === 'left' ? x + w * 0.22 : x + w * 0.78
  const dir = tail === 'left' ? -1 : 1
  return (
    <g>
      <path d={wobble(pts, seed, 2)} {...pen} fill="#fff" />
      <path d={`M${tx - 8 * dir} ${y + h - 3} l${10 * dir} 16 l${2 * dir} -14`} {...pen} fill="#fff" />
      {children}
    </g>
  )
}

const say = { fontFamily: 'Inter, sans-serif', fontWeight: 700, fill: DOODLE, textAnchor: 'middle' as const }

function Phone({ x, y, rot = 0 }: { x: number; y: number; rot?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d={rect(0, 0, 34, 58, 61)} {...pen} fill="#fff" />
      <path d="M8 8h18v18H8z" {...pen} strokeWidth={1.6} />
      <path d="M12 12h4v4h-4zM20 18h3v3h-3z" fill={DOODLE} />
      <path d="M13 50h8" {...pen} />
    </g>
  )
}

function Mark({ x, y, r, color }: { x: number; y: number; r: number; color: string }) {
  return <path transform={`translate(${x} ${y}) rotate(${r})`} d="M0 0h22" stroke={color} strokeWidth={3} strokeLinecap="round" />
}

function Social({ qrRef }: { qrRef: string }) {
  const url = VISUAL_URL(qrRef)
  return (
    <div className="art social">
      <svg className="doodles" viewBox="0 0 1200 630" width="1200" height="630" aria-hidden>
        {/* Left arc */}
        <Face x={290} y={150} r={24} rot={-12} seed={3} hair="spikes" />
        <Bubble x={318} y={58} w={112} h={58} tail="left" seed={5}><text x={374} y={94} fontSize={20} {...say}>RSVP!</text></Bubble>
        <Face x={180} y={318} r={32} rot={14} seed={9} mood="open" hair="curl" />
        <Phone x={228} y={300} rot={18} />
        <Face x={268} y={500} r={30} rot={-6} seed={13} hair="bun" />
        <Bubble x={300} y={396} w={118} h={112} tail="left" seed={17}><Qr x={321} y={414} size={76} url={url} /></Bubble>
        {/* Right arc */}
        <Bubble x={786} y={70} w={108} h={56} tail="right" seed={21}><text x={840} y={106} fontSize={22} {...say}>Yes!</text></Bubble>
        <Face x={912} y={150} r={26} rot={10} seed={23} mood="smile" hair="curl" />
        <Bubble x={930} y={232} w={140} h={60} tail="left" seed={29}><text x={1000} y={268} fontSize={17} {...say}>2 lattes pls</text></Bubble>
        <Face x={1010} y={350} r={30} rot={-14} seed={31} mood="open" hair="spikes" />
        <Face x={918} y={512} r={28} rot={8} seed={37} mood="smile" hair="none" />
        <g transform="translate(788 404) rotate(-6)">
          <path d={rect(0, 0, 96, 120, 41)} {...pen} fill="#fff" />
          <text x={48} y={22} fontSize={12} {...say}>Yoga club</text>
          <Qr x={16} y={30} size={64} url={url} />
          <text x={48} y={110} fontSize={10} {...say} fontWeight={600}>Scan to sign up</text>
        </g>
        {/* Little marks, magenta and grey */}
        <Mark x={205} y={175} r={35} color={PINK} />
        <Mark x={225} y={420} r={-20} color="#d9d9d9" />
        <Mark x={210} y={590} r={-40} color={PINK} />
        <Mark x={455} y={250} r={55} color={PINK} />
        <Mark x={980} y={60} r={-45} color={PINK} />
        <Mark x={1060} y={440} r={10} color="#d9d9d9" />
        <Mark x={1010} y={588} r={50} color={PINK} />
        <Mark x={730} y={540} r={-30} color="#d9d9d9" />
      </svg>
      <div className="social-copy">
        <h1>Scan to <span style={{ color: PINK }}>RSVP</span>. Scan to order.<br />Scan to sign up.</h1>
      </div>
    </div>
  )
}

/* ---------- Changelog: 1200x630 exported at 2x, beige, real product UI ---------- */
function Wordmark() {
  return <span className="wordmark" aria-label="tally">tally<svg viewBox="0 0 128 124" width="15" height="15" aria-hidden><path d={TALLY_PATH} fill="#000" /></svg></span>
}

/** The new QR panel, as it looks in the product. */
function QrPanelMock({ url }: { url: string }) {
  return (
    <div className="pm">
      <div className="pm-head"><b>QR code</b><span className="pm-x">✕</span></div>
      <div className="pm-body">
        <div className="pm-art">
          <QrBox size={200} url={url} label="QR code" />
          <b>tally.so/r/KpYalV</b>
          <span>Made with Tally</span>
        </div>
        <div className="pm-actions">
          <div className="mock-split"><span><Download aria-hidden />Download SVG</span><span className="caret"><ChevronDown aria-hidden /></span></div>
          <div className="pm-btn"><Palette aria-hidden />Personalize</div>
        </div>
        <span className="pm-note">Scans are tagged, so you'll see responses from this code</span>
      </div>
    </div>
  )
}

function Changelog() {
  return (
    <div className="art changelog">
      <div className="cl-wm"><Wordmark /></div>
      <div className="cl-copy">
        <h1>Your forms,<br />now on paper</h1>
        <p>Grab your code from any form, right next to Copy.</p>
      </div>
      <div className="browser">
        <div className="browser-bar">
          <span className="dots"><i /><i /><i /></span>
          <span className="address">tally.so/forms/KpYalV/share</span>
        </div>
        <div className="browser-body">
          <div className="pg" aria-hidden>
            <b className="pg-title">Community picnic RSVP</b>
            <div className="pg-tabs"><span>Insights</span><span>Submissions</span><span className="on">Share</span><span>Integrations</span><span>Settings</span></div>
            <div className="pg-link"><span className="pg-input">https://tally.so/r/KpYalV</span><span className="pg-copy"><Copy aria-hidden />Copy</span><span className="pg-qr" /></div>
          </div>
          <div className="mock-dim" aria-hidden />
          <QrPanelMock url={VISUAL_URL('qr-changelog')} />
        </div>
      </div>
    </div>
  )
}

/* ---------- Poster: A-size portrait, 800x1131 exported at 2x ---------- */
function Poster() {
  const url = VISUAL_URL('qr-poster')
  return (
    <div className="art poster">
      <div className="po-wm"><Wordmark /></div>
      <svg className="doodles" viewBox="0 0 800 1131" width="800" height="1131" aria-hidden>
        <Bubble x={56} y={400} w={120} h={60} tail="left" seed={5}><text x={116} y={437} fontSize={21} {...say}>RSVP!</text></Bubble>
        <Face x={96} y={530} r={34} rot={-10} seed={3} hair="spikes" />
        <Bubble x={626} y={420} w={110} h={58} tail="right" seed={21}><text x={681} y={456} fontSize={22} {...say}>Yes!</text></Bubble>
        <Face x={704} y={560} r={32} rot={12} seed={23} mood="open" hair="curl" />
        <Face x={120} y={900} r={30} rot={8} seed={13} hair="bun" />
        <Face x={680} y={910} r={30} rot={-8} seed={37} mood="smile" hair="none" />
        <Phone x={600} y={980} rot={14} />
        <Mark x={60} y={650} r={35} color={PINK} />
        <Mark x={700} y={680} r={-30} color="#d9d9d9" />
        <Mark x={60} y={1010} r={-40} color={PINK} />
        <Mark x={720} y={760} r={50} color={PINK} />
      </svg>
      <div className="po-copy">
        <h1>Your forms,<br />now on paper</h1>
        <p>Grab your code from any form</p>
      </div>
      <div className="po-code">
        <QrBox size={360} url={url} label="QR code" />
        <b>tally.so/r/KpYalV</b>
      </div>
      <div className="po-foot">Made with Tally</div>
    </div>
  )
}

/* ---------- Form cover: 3000x1000, black, no text ---------- */
const WHITE = '#ffffff'
const linePen = { fill: 'none', stroke: WHITE, strokeWidth: 5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

/**
 * Tally shows covers at 25vh, object-fit cover, centred. On a 1440x900 screen that is only the middle
 * ~470px of the 1000px height, so the poster and its tape sit inside that band.
 */
function Cover() {
  const url = VISUAL_URL('qr-cover')
  const tick = (x: number, y: number, r: number) => <path transform={`translate(${x} ${y}) rotate(${r})`} d="M0 0h44" stroke={PINK} strokeWidth={7} strokeLinecap="round" />
  return (
    <div className="art cover-art">
      <svg viewBox="0 0 3000 1000" width="100%" height="100%" aria-label="A paper poster with a QR code, taped to a dark wall, and a hand holding up a phone to scan it">
        <defs>
          <filter id="poster-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="16" stdDeviation="22" floodColor="#ffffff" floodOpacity="0.12" />
          </filter>
        </defs>
        <rect width="3000" height="1000" fill="#000" />
        {/* Poster */}
        <g transform="translate(1640 510) rotate(2.5) scale(0.84)">
          <g filter="url(#poster-shadow)">
            <rect x={-190} y={-232} width={380} height={464} rx={6} fill="#fff" />
          </g>
          <Qr x={-150} y={-200} size={300} url={url} />
          <rect x={-120} y={128} width={240} height={14} rx={7} fill="#DFDFDF" />
          <rect x={-86} y={162} width={172} height={14} rx={7} fill="#DFDFDF" />
          {/* Tape */}
          <rect x={-70} y={-252} width={140} height={44} rx={4} fill="#DFDFDF" opacity={0.85} transform="rotate(-4)" />
        </g>
        {/* Hand holding a phone up to scan */}
        <g transform="translate(2020 500) rotate(-10) scale(0.84)">
          <path d={rect(-70, -120, 140, 250, 71)} {...linePen} />
          <path d="M-45 -92h90v124h-90z" {...linePen} strokeWidth={4} />
          <path d="M-30 -76h26v26h-26zM8 -40h22v22h-22zM-30 -20h18v18h-18z" fill={WHITE} />
          <path d="M-18 108h36" {...linePen} />
          {/* fingers wrapping the left edge, thumb over the right */}
          <path d="M-70 40c-34 4-40 30-8 34M-70 78c-34 4-38 28-6 32M-70 116c-28 6-30 26-2 28" {...linePen} />
          <path d="M70 60c30-10 46 6 30 30c-10 14-26 22-34 22" {...linePen} />
          {/* wrist running off the bottom */}
          <path d="M-60 140c-10 80-20 160-30 260M60 128c20 80 30 170 36 272" {...linePen} />
          {/* scan sparks */}
          <path d="M-110 -170l-28 -26M0 -190v-40M110 -170l28 -26" {...linePen} stroke="#DFDFDF" />
        </g>
        {/* Pink ticks, sparingly */}
        {tick(1330, 330, 35)}
        {tick(1360, 700, -30)}
        {tick(1890, 250, -50)}
        {tick(2300, 690, 20)}
        {/* Grey secondary marks */}
        <path d="M1920 760l40 24" stroke="#DFDFDF" strokeWidth={6} strokeLinecap="round" />
        <path d="M1300 520l-46 6" stroke="#DFDFDF" strokeWidth={6} strokeLinecap="round" />
      </svg>
    </div>
  )
}

function Exportable({ title, name, w = 1200, h = 630, children, caption, extra, onBeforeExport }: {
  title: string; name: string; w?: number; h?: number; children: ReactNode; caption: ReactNode; extra?: ReactNode; onBeforeExport?: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const exportPng = async () => {
    if (!ref.current) return
    setBusy(true)
    onBeforeExport?.()
    await document.fonts.ready
    const url = await toPng(ref.current.firstElementChild as HTMLElement, { width: w, height: h, pixelRatio: 2, cacheBust: true })
    const a = document.createElement('a')
    a.href = url
    a.download = `${name}-${w * 2}x${h * 2}.png`
    a.click()
    setBusy(false)
    setDone(true)
    setTimeout(() => setDone(false), 2000)
  }
  return (
    <section className="v-item">
      <div className="row-between v-head">
        <div className="stack gap-4"><h2>{title}</h2><span className="small muted">{w} × {h}, exported at 2x ({w * 2} × {h * 2})</span></div>
        <div className="row gap-8">
          {extra}
          <button type="button" className="btn btn-black" onClick={exportPng} disabled={busy} data-export={name}>
            {done ? <Check aria-hidden /> : <Download aria-hidden />}{done ? 'Exported' : busy ? 'Exporting' : 'Export PNG'}
          </button>
        </div>
      </div>
      <div className="v-frame" style={{ aspectRatio: `${w} / ${h}`, maxWidth: w < h ? 560 : undefined }}>
        <div className="v-scale" ref={ref} style={{ width: w, height: h, transform: `scale(calc(100cqw / ${w}px))` }}>{children}</div>
      </div>
      <div className="v-caption small">{caption}</div>
    </section>
  )
}

type Network = 'linkedin' | 'x'

export default function Visuals() {
  const [net, setNet] = useState<Network>('linkedin')
  return (
    <main className="visuals">
      <header className="v-top">
        <a href="../" className="row gap-8" style={{ textDecoration: 'none' }}><TallyMark size={18} /><b>Share, redesigned</b></a>
        <span className="small muted">Task 2: announcing QR codes</span>
      </header>
      <Exportable title="Changelog image" name="tally-qr-changelog"
        caption={<>
          <p><b>Your forms, now on paper</b></p>
          <p>Some forms belong offline: on a poster, a flyer, a menu or a name badge. Grab your code from any form, right next to Copy on the Share tab.</p>
          <ul>
            <li><b>Ready to print.</b> Download it as SVG, PDF or high-res PNG. It stays sharp from sticker size to A0.</li>
            <li><b>Make it yours.</b> It comes in Tally black with the Tally mark. Personalize it with your own colour and logo.</li>
            <li><b>One code per spot.</b> Make a code for the poster, the flyer and the slides, then download them all at once.</li>
            <li><b>Know what worked.</b> Scans are tagged, so each code gets its own row in Insights.</li>
            <li><b>On your phone?</b> Save the code to your photos or share it straight from the share sheet.</li>
          </ul>
          <p>Open any form, go to Share, and hit QR code. Happy printing!</p>
        </>}>
        <Changelog />
      </Exportable>
      <Exportable title="Poster" name="tally-qr-poster" w={800} h={1131}
        caption={<p>Print it, stick it up, and every scan shows up as qr-poster in Insights.</p>}>
        <Poster />
      </Exportable>
      <Exportable title="Form cover" name="tally-qr-cover" w={1500} h={500}
        caption={<p>Cover for the easter-egg form. No text, so it works behind any form title. The code opens tally.so/r/KpYalV?ref=qr-cover.</p>}>
        <Cover />
      </Exportable>
      <Exportable title={`Social image: ${net === 'linkedin' ? 'LinkedIn' : 'X'}`} name={`tally-qr-social-${net}`}
        extra={<div className="segmented" role="tablist" aria-label="Network" style={{ width: 180 }}>
          {(['linkedin', 'x'] as Network[]).map((n) => (
            <button key={n} type="button" role="tab" aria-selected={net === n} onClick={() => setNet(n)}>{n === 'linkedin' ? 'LinkedIn' : 'X'}</button>
          ))}
        </div>}
        caption={<p>One form, one QR code, endless places to stick it. New on the Share tab: download your QR code, make one per spot, and see which one brought responses. ✨</p>}>
        <Social key={net} qrRef={`qr-${net}`} />
      </Exportable>
      <p className="xs muted" style={{ textAlign: 'center' }}>Psst. The codes in these images really scan. Each one is tagged with where it was seen.</p>
    </main>
  )
}
