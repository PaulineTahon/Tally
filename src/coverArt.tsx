import { DEFAULT_STYLE, LOGO_RATIO, QUIET, eyePath, logoMarkup, matrix, modulePath } from './qr'

/* Shared drawing pieces for the visuals page. */

/** Every visual opens the same live form, tagged by where it was seen. */
const FORM = 'https://tally.so/r/KpYalV'
export const VISUAL_URL = (ref: string) => `${FORM}?ref=${ref}`

export const PINK = '#F81CE5'

/** A real, scannable code drawn as SVG, the same as the product: rounded dots and eyes in black, with a white Tally asterisk on a black tile. */
export function Qr({ x = 0, y = 0, size, url, clear = false }: { x?: number; y?: number; size: number; url: string; plain?: boolean; clear?: boolean }) {
  const m = matrix(url)
  const n = m.size + QUIET * 2
  const ls = m.size * LOGO_RATIO
  const lx = (n - ls) / 2
  return (
    <g data-layer="QR code" transform={`translate(${x} ${y}) scale(${size / n})`}>
      {!clear && <rect width={n} height={n} fill="#fff" />}
      <path data-layer="Dots" d={modulePath(m, true)} fill="#000" />
      <path data-layer="Corner eyes" d={eyePath(m)} fill="#000" />
      <g dangerouslySetInnerHTML={{ __html: logoMarkup(DEFAULT_STYLE, lx, lx, ls, 'data-layer') }} />
    </g>
  )
}

export function QrBox({ size, url, label, plain = false, clear = false }: { size: number; url: string; label: string; plain?: boolean; clear?: boolean }) {
  return <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label={label}><Qr size={size} url={url} plain={plain} clear={clear} /></svg>
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
