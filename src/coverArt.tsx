import { LOGO_RATIO, QUIET, matrix, modulePath } from './qr'
import { TALLY_PATH } from './mark'

/* Shared drawing pieces for the visuals page and the form header in the prototype. */

/** Every visual opens the same live form, tagged by where it was seen. */
const FORM = 'https://tally.so/r/KpYalV'
export const VISUAL_URL = (ref: string) => `${FORM}?ref=${ref}`

export const PINK = '#F81CE5'

/** A real, scannable code drawn as SVG, all black. Marketing art adds the black asterisk; `plain` matches the product's default code. */
export function Qr({ x = 0, y = 0, size, url, plain = false }: { x?: number; y?: number; size: number; url: string; plain?: boolean }) {
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
      <path d={modulePath(m, !plain)} fill="#000" shapeRendering="crispEdges" />
      {eyes.map(([ex, ey]) => (
        <g key={`${ex}-${ey}`} transform={`translate(${ex + QUIET} ${ey + QUIET})`}>
          <path d="M0 0h7v7h-7z M1 1v5h5v-5z" fill="#000" fillRule="evenodd" />
          <rect x={2} y={2} width={3} height={3} fill="#000" />
        </g>
      ))}
      {!plain && <rect x={lx} y={lx} width={ls} height={ls} rx={ls * 0.22} fill="#fff" />}
      {!plain && <g transform={`translate(${lx + pad} ${lx + pad + (ls - pad * 2 - 124 * k) / 2}) scale(${k})`}><path d={TALLY_PATH} fill="#000" /></g>}
    </g>
  )
}

/** Stand-alone code for HTML layouts. */
export function QrBox({ size, url, label, plain = false }: { size: number; url: string; label: string; plain?: boolean }) {
  return <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label={label}><Qr size={size} url={url} plain={plain} /></svg>
}

/** Deterministic wobble so the doodles look hand drawn. */
function rng(seed: number) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 } }
export function wobble(points: [number, number][], seed: number, amt = 2.2, close = true) {
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
export const rect = (x: number, y: number, w: number, h: number, seed: number) => wobble([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], seed)

const INK = '#000000'
const GREY = '#DFDFDF'
const pen = { fill: 'none', stroke: INK, strokeWidth: 5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

/**
 * Form cover, 3000x1000, no text. Off-white with black line art, centred on x 1500 so phones
 * and wide screens both keep it. Tally shows covers object-fit cover, centred, so on a wide
 * screen only the middle band of the height shows; everything that matters sits in y 340 to 680.
 */
export function CoverArt({ url, slice = false }: { url: string; slice?: boolean }) {
  const tick = (x: number, y: number, r: number) => <path transform={`translate(${x} ${y}) rotate(${r})`} d="M0 0h40" stroke={PINK} strokeWidth={6} strokeLinecap="round" />
  return (
    <svg viewBox="0 0 3000 1000" width="100%" height="100%" preserveAspectRatio={slice ? 'xMidYMid slice' : undefined}
      role="img" aria-label="A paper poster with a QR code taped up, and a hand holding up a phone to scan it">
      <defs>
        <filter id="cover-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="10" stdDeviation="16" floodColor="#000" floodOpacity="0.08" />
        </filter>
      </defs>
      <rect width="3000" height="1000" fill="#F7F7F6" />
      {/* Poster */}
      <g transform="translate(1350 505) rotate(2.5) scale(0.66)">
        <rect x={-190} y={-232} width={380} height={464} rx={6} fill="#fff" stroke={GREY} strokeWidth={3} filter="url(#cover-shadow)" />
        <Qr x={-150} y={-200} size={300} url={url} />
        <rect x={-120} y={128} width={240} height={14} rx={7} fill={GREY} />
        <rect x={-86} y={162} width={172} height={14} rx={7} fill={GREY} />
        <rect x={-70} y={-254} width={140} height={44} rx={4} fill={GREY} transform="rotate(-4)" />
      </g>
      {/* Hand holding a phone up to scan */}
      <g transform="translate(1710 500) rotate(-8) scale(0.66)">
        <path d={rect(-70, -120, 140, 250, 71)} {...pen} fill="#fff" />
        <path d="M-45 -92h90v124h-90z" {...pen} strokeWidth={4} />
        <path d="M-30 -76h26v26h-26zM8 -40h22v22h-22zM-30 -20h18v18h-18z" fill={INK} />
        <path d="M-18 108h36" {...pen} />
        <path d="M-70 40c-34 4-40 30-8 34M-70 78c-34 4-38 28-6 32M-70 116c-28 6-30 26-2 28" {...pen} />
        <path d="M70 60c30-10 46 6 30 30c-10 14-26 22-34 22" {...pen} />
        {/* wrist running off the bottom */}
        <path d="M-60 140c-6 140-12 420-18 720M60 128c10 160 18 440 24 732" {...pen} />
        <path d="M-110 -170l-28 -26M0 -190v-40M110 -170l28 -26" {...pen} stroke={GREY} />
      </g>
      {/* Three pink ticks, well away from the code */}
      {tick(1120, 410, 35)}
      {tick(1560, 380, -50)}
      {tick(1880, 610, 20)}
      {/* Grey secondary marks */}
      <path d="M1140 570l-44 6" stroke={GREY} strokeWidth={6} strokeLinecap="round" />
      <path d="M1580 670l38 22" stroke={GREY} strokeWidth={6} strokeLinecap="round" />
    </svg>
  )
}
