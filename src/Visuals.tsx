import { useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { toPng } from 'html-to-image'
import { Download, Check, Copy, Ellipsis, QrCode } from 'lucide-react'
import { CoverArt, QrBox, VISUAL_URL } from './coverArt'
import { TallyMark } from './chrome'
import { GuideCard, useGuide } from './guide'
import { guideCopy } from './guideCopy'

const ASSET = (f: string) => `${import.meta.env.BASE_URL}visuals/${f}`

/** An absolutely placed layer, in the frame's own 1x pixels. */
function Layer({ name, x, y, w, h, children, style }: { name: string; x: number; y: number; w: number; h: number; children?: ReactNode; style?: CSSProperties }) {
  return <div data-layer={name} className="layer" style={{ left: x, top: y, width: w, height: h, ...style }}>{children}</div>
}
function Img({ name, src, x, y, w, h, style }: { name: string; src: string; x: number; y: number; w: number; h: number; style?: CSSProperties }) {
  return <img data-layer={name} className="layer" src={ASSET(src)} alt="" style={{ left: x, top: y, width: w, height: h, ...style }} />
}
/** A white patch that hides a bit of the drawing (the drawn code's edges) so the real code sits cleanly on top. */
function Patch({ x, y, w, h, o }: { x: number; y: number; w: number; h: number; o?: number }) {
  return <Layer name="Patch" x={x} y={y} w={w} h={h} style={{ background: '#fff', opacity: o }} />
}
/** A shape rotated around its centre inside a box, as Figma places it. */
function Turned({ name, src, x, y, w, h, iw, ih, deg, o, inset }: { name: string; src: string; x: number; y: number; w: number; h: number; iw: number; ih: number; deg: number; o?: number; inset?: string }) {
  return (
    <Layer name={name} x={x} y={y} w={w} h={h} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ flex: 'none', transform: `rotate(${deg}deg)` }}>
        <div style={{ position: 'relative', width: iw, height: ih, opacity: o }}>
          <div style={{ position: 'absolute', inset: inset ?? 0 }}><img src={ASSET(src)} alt="" style={{ display: 'block', width: '100%', height: '100%' }} /></div>
        </div>
      </div>
    </Layer>
  )
}
/** The magenta underline: a pink shape cut to a brush stroke, tilted like in Figma. */
function Squiggle({ kind, x, y, w, h, iw, ih, mw, mh, mx, my }: { kind: 'poster' | 'social'; x: number; y: number; w: number; h: number; iw: number; ih: number; mw: number; mh: number; mx: number; my: number }) {
  const mask = `url(${ASSET(`${kind}-squiggle-mask.png`)})`
  return (
    <Layer name="Underline" x={x} y={y} w={w} h={h} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ flex: 'none', transform: 'rotate(-1.19deg) skewX(2.22deg)' }}>
        <div style={{ position: 'relative', width: iw, height: ih, maskImage: mask, WebkitMaskImage: mask, maskSize: `${mw}px ${mh}px`, WebkitMaskSize: `${mw}px ${mh}px`, maskPosition: `${mx}px ${my}px`, WebkitMaskPosition: `${mx}px ${my}px`, maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat' }}>
          <img src={ASSET(`${kind}-squiggle.svg`)} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
        </div>
      </div>
    </Layer>
  )
}
/** A real, scannable code where the drawing has its code. */
function RealQr({ x, y, size, url }: { x: number; y: number; size: number; url: string }) {
  return <Layer name="QR code" x={x} y={y} w={size} h={size}><QrBox size={size} url={url} label="QR code" clear /></Layer>
}

/* ---------- Social: 1200x630 exported at 2x, white, from Figma (Social Linkedin / proposal) ---------- */
function Social({ qrRef }: { qrRef: string }) {
  const o = 0.7
  return (
    <div className="art social">
      <div className="layer" data-layer="Illustration" style={{ inset: 0, overflow: 'hidden' }}>
        <Img name="Drawing" src="social-illustration.png" x={531.5} y={132} w={518} h={365.5} style={{ opacity: o }} />
        <Patch x={828.545} y={157.28} w={61.4575} h={16.8275} />
        <Img name="Patch" src="social-patch-5.svg" x={745} y={304.5} w={128.5} h={30.5} />
        <Patch x={707.825} y={304.34} w={43.8985} h={10.243} />
        <Patch x={715.14} y={288.975} w={14.633} h={23.4125} />
        <Patch x={715.14} y={166.06} w={14.633} h={23.4125} />
        <Patch x={706.36} y={152.16} w={49.02} h={21.949} />
        <Img name="Patch" src="social-patch-1.svg" x={946.34} y={256.415} w={15.73} h={31.0945} />
        <Turned name="Patch" src="social-patch-2.svg" x={940.685} y={253.415} w={23.8145} h={25.6125} iw={21.3205} ih={14.201} deg={-55.29} />
        <Turned name="Patch" src="social-patch-3.svg" x={948.895} y={245.35} w={70.4615} h={70.4615} iw={58.385} ih={41.263} deg={45} />
        <Img name="Patch" src="social-patch-4.svg" x={935.5} y={302} w={103.5} h={10.5} />
        <Patch x={708} y={164.493} w={169.44} h={141.507} />
        <RealQr x={719.04} y={162.477} size={164.16} url={VISUAL_URL(qrRef)} />
      </div>
      <h1 className="so-title" data-layer="Headline">Your forms,<br />out in the<br />real world</h1>
      <Squiggle kind="social" x={43.64} y={351.705} w={297.3345} h={36.587} iw={295.583} ih={30.508} mw={279.5} mh={17.4105} mx={16.859} my={8.5895} />
      <p className="so-sub" data-layer="Subline">Print it, share it, see what it brings in.</p>
      <div className="so-wm" data-layer="Tally wordmark"><Wordmark /></div>
    </div>
  )
}

/* ---------- Changelog: 1200x630 exported at 2x, beige, real product UI, from Figma (Changelog / proposal) ---------- */
function Wordmark() {
  // Tally's own header wordmark (tally.so/images/logo_v2.png). The site ships it as a PNG, not an SVG.
  return <img className="wordmark" src={`${import.meta.env.BASE_URL}tally-wordmark.png`} alt="tally" />
}

/** A tiny form, as drawn in the embed thumbnails. `big` is the Full page one. */
function MiniForm({ big = false, options = ['Yes, count me in', 'Maybe'], dot = false }: { big?: boolean; options?: string[]; dot?: boolean }) {
  return (
    <span className={`mf ${big ? 'is-big' : ''}`}>
      <span className="mf-title">Community picnic RSVP</span>
      <span className="mf-q">What's your name?</span>
      <span className="mf-in" />
      <span className="mf-q">Are you coming?</span>
      {options.map((o, i) => <span key={o} className="mf-opt">{o}{dot && i === 0 && <i className="mf-dot" />}</span>)}
      <span className="mf-sub"><span>Submit</span></span>
    </span>
  )
}

/** The Share tab as it looks now (Simple, my proposal): Share link with Copy and the QR code button, Use custom domain, the link preview with Customize preview, then Embed with no layout picked yet. */
function ShareTabMock() {
  return (
    <div className="cm" data-layer="Share tab UI" aria-hidden>
      <div className="cm-head">
        <b className="cm-title">Community picnic RSVP</b>
        <span className="cm-more"><Ellipsis aria-hidden /></span>
      </div>
      <div className="cm-tabs"><span>Insights</span><span>Submissions</span><span className="on">Share<b className="cm-tab-line" /></span><span>Integrations</span><span>Settings</span></div>
      <div className="cm-main">
        <span className="cm-label">Share link</span>
        <div className="cm-sections">
          <div className="cm-section">
            <div className="cm-group">
              <div className="cm-link">
                <span className="cm-input">tally.so/r/KpYalV</span>
                <span className="cm-copy"><Copy aria-hidden />Copy</span>
                <span className="cm-qrbtn" data-layer="QR code button"><QrCode aria-hidden /></span>
              </div>
              <span className="cm-text"><u>Use custom domain</u><span className="cm-pro">Pro</span></span>
            </div>
            <div className="cm-group">
              <span className="cm-label">Link preview</span>
              <div className="cm-card" data-layer="Link preview card">
                <img className="cm-card-img" src={`${import.meta.env.BASE_URL}link-preview.jpg`} alt="" />
                <span className="cm-card-text"><span className="cm-card-title">Community picnic RSVP</span><span className="cm-card-site">tally.so</span></span>
              </div>
              <span className="cm-text"><u>Customize preview</u><span className="cm-pro">Pro</span></span>
            </div>
          </div>
          <div className="cm-group">
            <span className="cm-label">Embed</span>
            <span className="cm-desc">Pick how the form shows up on your site. <u>How embedding works</u></span>
            <div className="cm-embeds">
              <span className="cm-embed">
                <span className="cm-thumb is-standard">
                  <i className="b1" /><i className="b2" /><i className="b3" />
                  <span className="cm-dash"><MiniForm /></span>
                  <i className="b4" /><i className="b3" />
                  <i className="cm-bar" /><i className="cm-dots" />
                </span>Standard
              </span>
              <span className="cm-embed">
                <span className="cm-thumb is-popup">
                  <i className="b1" /><i className="b2" /><i className="b3" /><i className="b4" /><i className="b4" /><i className="b3" />
                  <i className="cm-bar" />
                  <span className="cm-pop"><MiniForm dot /></span>
                  <i className="cm-dots" />
                </span>Popup
              </span>
              <span className="cm-embed">
                <span className="cm-thumb is-full">
                  <span className="cm-full"><MiniForm big options={['Yes, count me in', 'Maybe', "Can't make it"]} /></span>
                  <i className="cm-bar" /><i className="cm-dots" />
                </span>Full page
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

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
          <img className="dots" src={ASSET('window-dots.svg')} alt="" />
          <span className="address">tally.so/forms/KpYalV/share</span>
        </div>
        <div className="browser-body">
          <ShareTabMock />
        </div>
      </div>
    </div>
  )
}

/** The changelog post, in one place. */
const POST = {
  title: 'Share your form anywhere',
  body: 'Share now has everything you need to get your form in front of people, and to see what works.',
  bullets: [
    ['QR codes, ready to print.', 'Every form gets its own QR code. Download it as PNG, SVG or PDF, and add your logo in the middle (Pro).'],
    ['Embed and custom domain, one click away.', 'Copy your embed code or customize it right from Share, and put your form on your own domain (Pro).'],
  ] as [string, string][],
  end: 'Open Share on any form to try it. Happy sharing!',
}

/* ---------- Poster: A-size portrait, 800x1131 exported at 2x, from Figma (Poster, composition v3 / proposal) ---------- */
function Poster() {
  return (
    <div className="art poster">
      <h1 className="po-title" data-layer="Headline">Your forms,<br />out in the<br />real world</h1>
      <Squiggle kind="poster" x={209.445} y={361.905} w={401.0955} h={49.3835} iw={398.733} ih={41.1785} mw={377.0375} mh={23.5} mx={22.7425} my={11.594} />
      <p className="po-sub" data-layer="Subline">Every form comes with a QR code</p>
      <div className="po-wm" data-layer="Tally wordmark"><Wordmark /></div>
      <div className="layer" data-layer="Illustration" style={{ inset: 0 }}>
        <Img name="Drawing" src="poster-illustration.png" x={113} y={477.5} w={573.906} h={509} />
        <Patch x={442.105} y={564.85} w={68.0905} h={18.644} />
        <Patch x={442.105} y={727.78} w={48.636} h={18.644} />
        <Patch x={308.355} y={727.78} w={48.636} h={11.3485} />
        <Patch x={316.46} y={710.76} w={16.212} h={25.939} />
        <Patch x={316.46} y={574.58} w={16.212} h={25.939} />
        <Patch x={306.735} y={559.175} w={54.3105} h={24.318} />
        <Patch x={306.735} y={564.85} w={203.461} h={181.5745} />
        <RealQr x={318.08} y={564.04} size={181.899} url={VISUAL_URL('qr-poster')} />
        <Img name="Patch" src="poster-patch-1.svg" x={572.61} y={674.685} w={17.428} h={34.4505} />
        <Turned name="Patch" src="poster-patch-2.svg" x={566.345} y={671.36} w={26.385} h={28.377} iw={23.6215} ih={15.7335} deg={-55.29} />
        <Turned name="Patch" src="poster-patch-3.svg" x={575.445} y={662.425} w={78.066} h={78.066} iw={64.686} ih={45.716} deg={45} inset="-1.14% -0.73% -1.04% -0.73%" />
        <Img name="Patch" src="poster-patch-4.svg" x={560.6} y={725.19} w={114.6705} h={11.6332} />
      </div>
      <p className="po-foot" data-layer="Link">tally.so/r/KpYalV</p>
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
        <div className="stack gap-4"><h2>Changelog GIF</h2><span className="small muted">2400 × 1600, 10 fps, 17.4 s loop</span></div>
        <a className="btn btn-black" href={GIF} download="tally-qr-changelog-2400x1600.gif"><Download aria-hidden />Download GIF</a>
      </div>
      <div className="v-frame" style={{ aspectRatio: '3 / 2' }}>
        <img src={GIF} alt="On the Share tab, Copy copies the link, and the QR code button next to it opens Your QR Code, which downloads as a PNG. In Embed, picking Standard shows its code with Copy code. Insights then lists Your QR Code next to Direct / None in Sources." style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>
      <div className="v-caption small"><p>For the changelog entry, next to the image above. It starts on the Share tab, copies the link, opens Your QR Code from the button next to Copy and downloads it, picks Standard in Embed and copies its code, then ends on Insights with Your QR Code in Sources. Social posts and link previews keep using the static image.</p></div>
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
        caption={<p>Print it, share it, and see in Insights what it brings in.</p>}>
        <Social key={net} qrRef={`qr-${net}`} />
      </Exportable>
      <p className="xs muted" style={{ textAlign: 'center' }}>Psst. The codes in these images really scan. Each one is tagged with where it was seen.</p>
    </main>
  )
}
