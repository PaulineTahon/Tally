import { useRef, useState, type ReactNode } from 'react'
import { toPng } from 'html-to-image'
import { Download, Check, Copy } from 'lucide-react'
import { CoverArt, PINK, Qr, QrBox, VISUAL_URL, rect, wobble } from './coverArt'
import { TallyMark } from './chrome'
import { GuideCard, useGuide } from './guide'
import { guideCopy } from './guideCopy'




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
    <g data-layer="Face" transform={`translate(${x} ${y}) rotate(${rot})`} {...pen}>
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
    <g data-layer="Speech bubble">
      <path d={wobble(pts, seed, 2)} {...pen} fill="#fff" />
      <path d={`M${tx - 8 * dir} ${y + h - 3} l${10 * dir} 16 l${2 * dir} -14`} {...pen} fill="#fff" />
      {children}
    </g>
  )
}

const say = { fontFamily: 'Inter, sans-serif', fontWeight: 700, fill: DOODLE, textAnchor: 'middle' as const }

function Phone({ x, y, rot = 0, url }: { x: number; y: number; rot?: number; url: string }) {
  return (
    <g data-layer="Phone" transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d={rect(0, 0, 34, 58, 61)} {...pen} fill="#fff" />
      {/* A real code on the screen, never a fake pattern. */}
      <Qr x={6} y={8} size={22} url={url} />
      <path d="M13 50h8" {...pen} />
    </g>
  )
}

function Mark({ x, y, r, color }: { x: number; y: number; r: number; color: string }) {
  return <path data-layer="Accent mark" transform={`translate(${x} ${y}) rotate(${r})`} d="M0 0h22" stroke={color} strokeWidth={3} strokeLinecap="round" />
}

function Social({ qrRef }: { qrRef: string }) {
  const url = VISUAL_URL(qrRef)
  return (
    <div className="art social">
      <svg data-layer="Doodles" className="doodles" viewBox="0 0 1200 630" width="1200" height="630" aria-hidden>
        {/* Left arc */}
        <Face x={290} y={150} r={24} rot={-12} seed={3} hair="spikes" />
        <Bubble x={318} y={58} w={112} h={58} tail="left" seed={5}><text x={374} y={94} fontSize={20} {...say}>RSVP!</text></Bubble>
        <Face x={180} y={318} r={32} rot={14} seed={9} mood="open" hair="curl" />
        <Phone x={228} y={300} rot={18} url={url} />
        <Face x={268} y={500} r={30} rot={-6} seed={13} hair="bun" />
        <Bubble x={300} y={396} w={118} h={112} tail="left" seed={17}><Qr x={321} y={414} size={76} url={url} /></Bubble>
        {/* Right arc */}
        <Bubble x={786} y={70} w={108} h={56} tail="right" seed={21}><text x={840} y={106} fontSize={22} {...say}>Yes!</text></Bubble>
        <Face x={912} y={150} r={26} rot={10} seed={23} mood="smile" hair="curl" />
        <Bubble x={930} y={232} w={140} h={60} tail="left" seed={29}><text x={1000} y={268} fontSize={17} {...say}>2 lattes pls</text></Bubble>
        <Face x={1010} y={350} r={30} rot={-14} seed={31} mood="open" hair="spikes" />
        <Face x={918} y={512} r={28} rot={8} seed={37} mood="smile" hair="none" />
        <g data-layer="Yoga club flyer" transform="translate(788 404) rotate(-6)">
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
      <div className="social-copy" data-layer="Copy">
        <h1 data-layer="Headline">Scan to <span style={{ color: PINK }}>RSVP</span>. Scan to order.<br />Scan to sign up.</h1>
      </div>
    </div>
  )
}

/* ---------- Changelog: 1200x630 exported at 2x, beige, real product UI ---------- */
function Wordmark() {
  // Tally's own header wordmark (tally.so/images/logo_v2.png). The site ships it as a PNG, not an SVG.
  return <img className="wordmark" src={`${import.meta.env.BASE_URL}tally-wordmark.png`} alt="tally" />
}

/** The new QR panel, as it looks in the product. */
/** The Share tab with the QR Code tab open on the main code, as in the prototype. */
function ShareTabMock({ url }: { url: string }) {
  const Row = ({ name, n }: { name: string; n: string }) => (
    <div className="sm-row">
      <span className="sm-thumb"><QrIcon /></span>
      <span className="sm-name">{name}</span><span className="sm-n">{n}</span>
      <span className="sm-icon"><Download aria-hidden /></span><span className="sm-more">···</span>
    </div>
  )
  return (
    <div className="pg" data-layer="Share tab UI" aria-hidden>
      <b className="pg-title">Community picnic RSVP</b>
      <div className="pg-tabs"><span>Insights</span><span>Submissions</span><span className="on">Share</span><span>Integrations</span><span>Settings</span></div>
      <div className="pg-link">
        <span className="pg-input">tally.so/r/KpYalV</span>
        <span className="pg-copy"><Copy aria-hidden />Copy</span>
        <span className="pg-btn"><QrIcon />QR Code</span>
      </div>
      <div className="sm-seg"><span>Social</span><span>Email</span><span className="on">QR Code</span></div>
      <div className="sm-list">
        <div className="sm-row is-main">
          <span className="sm-big" data-layer="Main code"><QrBox size={132} url={url} label="QR code" /></span>
          <span className="sm-main-text"><span className="sm-name">Main code</span><span className="sm-n">Ready to print</span></span>
          <span className="sm-dl"><Download aria-hidden />Download SVG</span>
        </div>
        <Row name="Poster" n="2 responses" />
        <Row name="Flyer" n="1 response" />
      </div>
    </div>
  )
}

const QrIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect width="5" height="5" x="3" y="3" rx="1" /><rect width="5" height="5" x="16" y="3" rx="1" /><rect width="5" height="5" x="3" y="16" rx="1" />
    <path d="M21 16h-3a2 2 0 0 0-2 2v3M21 21v.01M12 7v3a2 2 0 0 1-2 2H7M3 12h.01M12 3h.01M12 16v.01M16 12h1M21 12v.01M12 21v-1" />
  </svg>
)

function Changelog() {
  return (
    <div className="art changelog">
      <div className="cl-wm" data-layer="Tally wordmark"><Wordmark /></div>
      <div className="cl-copy" data-layer="Copy">
        <h1 data-layer="Headline">Your forms, out in the real world</h1>
        <p data-layer="Subline">Every form now comes with a QR code, ready the moment you publish.</p>
      </div>
      <div className="browser" data-layer="Browser window">
        <div className="browser-bar" data-layer="Browser bar">
          <span className="dots"><i /><i /><i /></span>
          <span className="address">tally.so/forms/KpYalV/share</span>
        </div>
        <div className="browser-body">
          <ShareTabMock url={VISUAL_URL('qr-changelog')} />
        </div>
      </div>
    </div>
  )
}

/** The changelog post, in one place. */
const POST = {
  title: 'Your forms, out in the real world',
  body: 'Some forms work best in person: on a poster, a flyer, a menu, a slide or a name badge. Every form now comes with a QR code, ready the moment you publish. Open Share and hit QR Code.',
  bullets: [
    ['Ready to print.', 'Download SVG, PDF or a high-res PNG. SVG and PDF stay sharp at any size, from a sticker to a banner.'],
    ['One code per place.', 'Using your form in more than one place? Add a code for each one, for free, and Insights shows which one brings in responses.'],
    ['Make it yours (Pro).', 'Add your logo in the middle of the code. Codes stay black, so they are easy to scan.'],
    ['On your phone?', 'Save your code to your photos or share it straight away.'],
  ] as [string, string][],
  end: 'Happy sharing!',
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
        <Phone x={600} y={980} rot={14} url={url} />
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
    </div>
  )
}

/* ---------- Form cover: 3000x1000, off-white, no text. The art lives in coverArt.tsx. ---------- */
function Cover() {
  return <div className="art cover-art"><CoverArt url={VISUAL_URL('qr-cover')} /></div>
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

const GIF = `${import.meta.env.BASE_URL}tally-qr-changelog-2400x1600.gif`

/** The animated changelog entry. The static image above stays the og and social fallback. */
function ChangelogGif() {
  return (
    <section className="v-item">
      <div className="row-between v-head">
        <div className="stack gap-4"><h2>Changelog GIF</h2><span className="small muted">2400 × 1600, 10 fps, 5.9 s loop</span></div>
        <a className="btn btn-black" href={GIF} download="tally-qr-changelog-2400x1600.gif"><Download aria-hidden />Download GIF</a>
      </div>
      <div className="v-frame" style={{ aspectRatio: '3 / 2' }}>
        <img src={GIF} alt="On the Share tab, QR Code opens the main code, then it downloads as SVG" style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>
      <div className="v-caption small"><p>For the changelog entry, next to the image above. Social posts and link previews keep using the static image.</p></div>
    </section>
  )
}

type Network = 'linkedin' | 'x'

/** The guide card on this page, with a small button to bring it back once hidden. */
function VisualsGuide() {
  const g = useGuide('visuals')
  return (
    <>
      <GuideCard page="visuals" open={!g.hidden} onClose={g.hide} />
      {g.hidden && <button type="button" className="guide-restore" onClick={g.show}>{guideCopy.restore}</button>}
    </>
  )
}

export default function Visuals() {
  const [net, setNet] = useState<Network>('linkedin')
  return (
    <main className="visuals">
      <VisualsGuide />
      <header className="v-top">
        <a href="../" className="row gap-8" style={{ textDecoration: 'none' }}><TallyMark size={18} /><b>Share, redesigned</b></a>
        <span className="small muted">Task 2: announcing QR codes</span>
      </header>
      <Exportable title="Changelog image" name="tally-qr-changelog"
        caption={<>
          <p><b>{POST.title}</b></p>
          <p>{POST.body}</p>
          <ul>{POST.bullets.map(([lead, rest]) => <li key={lead}><b>{lead}</b> {rest}</li>)}</ul>
          <p>{POST.end}</p>
        </>}>
        <Changelog />
      </Exportable>
      <ChangelogGif />
      <Exportable title="Poster" name="tally-qr-poster" w={800} h={1131}
        caption={<p>Print it, stick it up, and responses from it show up as Poster in Insights.</p>}>
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
        caption={<p>One form, one QR code, endless places to stick it. New on the Share tab: download your QR code, make one per place, and see which one brought responses. ✨</p>}>
        <Social key={net} qrRef={`qr-${net}`} />
      </Exportable>
      <p className="xs muted" style={{ textAlign: 'center' }}>Psst. The codes in these images really scan. Each one is tagged with where it was seen.</p>
    </main>
  )
}
