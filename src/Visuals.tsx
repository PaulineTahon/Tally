import { useRef, useState, type ReactNode } from 'react'
import { toPng } from 'html-to-image'
import { Download, ChevronDown, Check } from 'lucide-react'
import { matrix, modulePath } from './qr'
import { EASTER_EGG } from './store'
import { TallyMark } from './chrome'

const PINK = '#F81CE5'

/** A real, scannable code drawn as SVG. */
function Qr({ x = 0, y = 0, size, url = EASTER_EGG, color = '#000' }: { x?: number; y?: number; size: number; url?: string; color?: string }) {
  const m = matrix(url)
  const n = m.size + 8
  return (
    <g transform={`translate(${x} ${y}) scale(${size / n})`}>
      <rect width={n} height={n} fill="#fff" />
      <path d={modulePath(m, false)} fill={color} shapeRendering="crispEdges" />
    </g>
  )
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

function Social() {
  return (
    <div className="art social">
      <svg className="doodles" viewBox="0 0 1200 630" width="1200" height="630" aria-hidden>
        {/* Left arc */}
        <Face x={290} y={150} r={24} rot={-12} seed={3} hair="spikes" />
        <Bubble x={318} y={58} w={112} h={58} tail="left" seed={5}><text x={374} y={94} fontSize={20} {...say}>RSVP!</text></Bubble>
        <Face x={180} y={318} r={32} rot={14} seed={9} mood="open" hair="curl" />
        <Phone x={228} y={300} rot={18} />
        <Face x={268} y={500} r={30} rot={-6} seed={13} hair="bun" />
        <Bubble x={300} y={396} w={118} h={112} tail="left" seed={17}><Qr x={321} y={414} size={76} /></Bubble>
        {/* Right arc */}
        <Bubble x={786} y={70} w={108} h={56} tail="right" seed={21}><text x={840} y={106} fontSize={22} {...say}>Yes!</text></Bubble>
        <Face x={912} y={150} r={26} rot={10} seed={23} mood="smile" hair="curl" />
        <Bubble x={930} y={232} w={140} h={60} tail="left" seed={29}><text x={1000} y={268} fontSize={17} {...say}>2 lattes pls</text></Bubble>
        <Face x={1010} y={350} r={30} rot={-14} seed={31} mood="open" hair="spikes" />
        <Face x={918} y={512} r={28} rot={8} seed={37} mood="smile" hair="none" />
        <g transform="translate(788 404) rotate(-6)">
          <path d={rect(0, 0, 96, 120, 41)} {...pen} fill="#fff" />
          <text x={48} y={22} fontSize={12} {...say}>Yoga club</text>
          <Qr x={16} y={30} size={64} />
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

/* ---------- Changelog: 1200x630 exported at 2x, beige ---------- */
function Changelog() {
  return (
    <div className="art changelog">
      <div className="cl-copy">
        <span className="cl-tag">New</span>
        <h1>Your forms,<br />now on paper</h1>
        <p>Grab a QR code for any form, right next to Copy on the Share tab.</p>
      </div>
      <div className="browser">
        <div className="browser-bar">
          <span className="dots"><i /><i /><i /></span>
          <span className="address">tally.so/forms/QoKz0A/share</span>
        </div>
        <div className="browser-body">
          <div className="mock-dim" aria-hidden />
          <div className="mock-modal">
            <div className="mock-head"><b>QR code</b><span>Print it, stick it, share it.</span></div>
            <div className="mock-grid">
              <div className="mock-preview">
                <svg viewBox="0 0 200 200" width="190" height="190" aria-label="QR code"><Qr size={200} url="https://tally.so/r/QoKz0A?ref=qr" /></svg>
                <b>tally.so/r/QoKz0A</b>
                <span>For anyone who'd rather type.</span>
              </div>
              <div className="mock-controls">
                <div className="mock-split"><span><Download aria-hidden />Download SVG</span><span className="caret"><ChevronDown aria-hidden /></span></div>
                <span className="mock-help">Sharp at any size. Best for print.</span>
                <div className="mock-row"><span>Track responses from QR</span><span className="mock-switch" /></div>
                <span className="mock-chip">tally.so/r/QoKz0A?ref=qr</span>
                <div className="mock-sep" />
                <div className="mock-row"><span><b>Style</b> <em>Black, no logo, medium</em></span><ChevronDown aria-hidden /></div>
                <div className="mock-seg"><span className="on">Black</span><span>Brand colour</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Exportable({ title, name, size, children, caption }: { title: string; name: string; size: string; children: ReactNode; caption: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const exportPng = async () => {
    if (!ref.current) return
    setBusy(true)
    await document.fonts.ready
    const url = await toPng(ref.current.firstElementChild as HTMLElement, { width: 1200, height: 630, pixelRatio: 2, cacheBust: true })
    const a = document.createElement('a')
    a.href = url
    a.download = `${name}.png`
    a.click()
    setBusy(false)
    setDone(true)
    setTimeout(() => setDone(false), 2000)
  }
  return (
    <section className="v-item">
      <div className="row-between v-head">
        <div className="stack gap-4"><h2>{title}</h2><span className="small muted">{size}</span></div>
        <button type="button" className="btn btn-black" onClick={exportPng} disabled={busy} data-export={name}>
          {done ? <Check aria-hidden /> : <Download aria-hidden />}{done ? 'Exported' : busy ? 'Exporting' : 'Export PNG'}
        </button>
      </div>
      <div className="v-frame"><div className="v-scale" ref={ref}>{children}</div></div>
      <div className="v-caption small">{caption}</div>
    </section>
  )
}

export default function Visuals() {
  return (
    <main className="visuals">
      <header className="v-top">
        <a href="../" className="row gap-8" style={{ textDecoration: 'none' }}><TallyMark size={18} /><b>Share, redesigned</b></a>
        <span className="small muted">Task 2: announcing QR codes</span>
      </header>
      <Exportable title="Changelog image" name="tally-qr-changelog-2400x1260" size="1200 × 630, exported at 2x (2400 × 1260)"
        caption={<>
          <p><b>Your forms, now on paper</b></p>
          <p>Some forms belong offline: on a poster, a flyer, a menu or a name badge. You can now grab a QR code for any form, right next to Copy on the Share tab.</p>
          <ul>
            <li><b>Ready to print.</b> Download it as SVG, PDF or high-res PNG. It stays sharp from sticker size to A0.</li>
            <li><b>Make it yours.</b> Pick your brand colour or classic black, add your logo in the middle, and choose a size.</li>
            <li><b>Human-friendly too.</b> Your short link is printed under the code, for anyone without a camera handy.</li>
            <li><b>Know what worked.</b> Turn on the ?ref=qr tag to see how many responses came from your poster.</li>
            <li><b>On your phone?</b> Save the code to your photos or share it straight from the share sheet.</li>
          </ul>
          <p>Open any form, go to Share, and hit QR code. Happy printing!</p>
        </>}>
        <Changelog />
      </Exportable>
      <Exportable title="Social image" name="tally-qr-social-2400x1260" size="2400 × 1260"
        caption={<p>One form, one QR code, endless places to stick it. New on the Share tab: download your QR code, add your logo and see how many responses came from it. ✨</p>}>
        <Social />
      </Exportable>
      <p className="xs muted" style={{ textAlign: 'center' }}>Psst. The codes in these images really scan. Try the ones on the social image.</p>
    </main>
  )
}
