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
const line = (x1: number, y1: number, x2: number, y2: number, seed: number) => wobble([[x1, y1], [x2, y2]], seed, 1.4, false)

const ink = { fill: 'none', stroke: '#000', strokeWidth: 3, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
const tick = { fill: 'none', stroke: PINK, strokeWidth: 3.4, strokeLinecap: 'round' as const }

function Ticks({ x, y, r = 0 }: { x: number; y: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r})`} {...tick}>
      <path d="M0 -14 L0 -26" /><path d="M10 -10 L19 -19" /><path d="M-10 -10 L-19 -19" />
    </g>
  )
}

/* ---------- Social: 2400x1260, white ---------- */
function Social() {
  return (
    <div className="art social">
      <svg className="doodles" viewBox="0 0 1200 630" width="1200" height="630" aria-hidden>
        {/* Wedding card */}
        <g transform="translate(96 300) rotate(-8 110 140) scale(0.92)">
          <path d={rect(0, 0, 220, 280, 7)} {...ink} fill="#fff" />
          <path d={line(20, 24, 200, 24, 3)} {...ink} strokeWidth={2} />
          <path d="M98 52c-8-12-28-6-20 10l20 18 20-18c8-16-12-22-20-10z" {...ink} strokeWidth={2.4} />
          <text x="110" y="110" textAnchor="middle" className="hand">Sam &amp; Noor</text>
          <text x="110" y="132" textAnchor="middle" className="hand small">say yes by June 1</text>
          <Qr x={60} y={146} size={100} />
          <text x="110" y="266" textAnchor="middle" className="hand small">Scan to RSVP</text>
        </g>
        <Ticks x={318} y={322} r={20} />
        {/* Menu */}
        <g transform="translate(880 290) rotate(6 115 150) scale(0.92)">
          <path d={rect(0, 0, 230, 300, 11)} {...ink} fill="#fff" />
          <text x="115" y="40" textAnchor="middle" className="hand big">Menu</text>
          {[64, 86, 108, 130].map((yy, i) => <path key={yy} d={line(24, yy, i % 2 ? 160 : 190, yy, 20 + i)} {...ink} strokeWidth={2} />)}
          <path d="M28 158c10-14 30-14 40 0" {...ink} strokeWidth={2.2} />
          <path d="M24 160h48" {...ink} strokeWidth={2.2} />
          <Qr x={110} y={160} size={100} />
          <text x="160" y="284" textAnchor="middle" className="hand small">Scan to order</text>
        </g>
        <Ticks x={862} y={300} r={-30} />
        {/* Flyer on a lamppost */}
        <g transform="translate(468 400)">
          <path d={wobble([[132, -30], [132, 200]], 41, 1.5, false)} {...ink} strokeWidth={6} />
          <g transform="rotate(-4 130 80)">
            <path d={rect(40, 0, 184, 180, 31)} {...ink} fill="#fff" />
            <circle cx="66" cy="8" r="5" fill={PINK} />
            <text x="132" y="34" textAnchor="middle" className="hand">Yoga in the park</text>
            <Qr x={92} y={46} size={80} />
            <text x="132" y="152" textAnchor="middle" className="hand small">Scan to sign up</text>
          </g>
        </g>
        <Ticks x={700} y={410} r={40} />
        {/* Little extras */}
        <path d={wobble([[70, 90], [120, 50], [175, 90], [130, 140]], 77, 3)} {...ink} />
        <path d="M98 90l20 14 30-34" {...tick} />
        <path d={wobble([[1030, 70], [1120, 70], [1120, 140], [1030, 140]], 91, 3)} {...ink} />
        <path d="M1045 94h50M1045 114h36" {...ink} strokeWidth={2} />
        <Ticks x={1140} y={70} r={30} />
      </svg>
      <div className="social-copy">
        <h1>Scan to <span style={{ color: PINK }}>RSVP</span>. Scan to order.<br />Scan to sign up.</h1>
        <p><TallyMark size={18} /> Tally</p>
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
