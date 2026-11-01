import QRCode from 'qrcode'
import { TALLY_PATH } from './mark'

/** One size for everything. SVG and PDF are vector; PNG is big enough to print sharply up to A3. */
export const PNG_MIN_PX = 3200
export const PDF_CODE_MM = 120
export type QrFormat = 'svg' | 'pdf' | 'png'

/**
 * Codes are always black. The one personal touch is your own logo (Pro), which replaces
 * the Tally asterisk in the middle. Anyone who wants another colour can recolour the SVG.
 */
export interface QrStyle {
  /** Data URL of an uploaded logo, or null for the Tally asterisk. */
  logo: string | null
}
export const DEFAULT_STYLE: QrStyle = { logo: null }

/** The only colour a code is ever drawn in. */
export const QR_INK = '#000000'

export interface QrOptions {
  url: string
  shortLink: string
  style: QrStyle
  /** One plain line with the short link under the code. On by default, on every plan. */
  showLink: boolean
  /** Small line under the link, like the placement name. */
  label?: string
}

export interface Matrix {
  size: number
  version: number
  get: (x: number, y: number) => boolean
}

export function matrix(url: string): Matrix {
  // Level H keeps the code readable with a logo in the middle.
  const qr = QRCode.create(url, { errorCorrectionLevel: 'H' })
  const size = qr.modules.size
  const data = qr.modules.data
  return { size, version: qr.version, get: (x, y) => data[y * size + x] === 1 }
}

export const QUIET = 4
/** Share of the code width covered by the logo tile. Small enough for level H. */
export const LOGO_RATIO = 0.2

export function inLogo(m: Matrix, x: number, y: number) {
  const c = m.size / 2
  const half = (m.size * LOGO_RATIO) / 2 + 0.5
  return Math.abs(x + 0.5 - c) < half && Math.abs(y + 0.5 - c) < half
}

export function inFinder(m: Matrix, x: number, y: number) {
  const n = m.size
  return (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7)
}

/** Every code carries a centre mark, so modules there are always knocked out. Level H covers it. */
export const hasLogo = (_st: QrStyle) => true

/** Rounded corners on the logo tile: radius about a quarter of its side. */
export const TILE_RADIUS = 0.24
/** White margin between the black tile and the modules, as a share of the logo area. */
export const TILE_MARGIN = 0.1

/**
 * The centre mark, on every plan: a white Tally asterisk on a black rounded tile, with a thin
 * white margin so the tile never touches the modules. The whole area (tile and margin) is
 * LOGO_RATIO of the code width. A logo uploaded in Personalize replaces it, on a white tile,
 * since most logos are drawn for a light background.
 * `layer` names the group: an id in files, a data attribute when it is inlined into a page.
 */
export function logoMarkup(st: QrStyle, x: number, y: number, s: number, layer: 'id' | 'data-layer' = 'id') {
  const open = `<g ${layer}="QR logo">`
  const quiet = `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${s * TILE_RADIUS}" ry="${s * TILE_RADIUS}" fill="#fff"/>`
  if (st.logo) {
    const p = s * 0.14
    return `${open}${quiet}<image href="${st.logo}" x="${x + p}" y="${y + p}" width="${s - p * 2}" height="${s - p * 2}" preserveAspectRatio="xMidYMid meet"/></g>`
  }
  const m = s * TILE_MARGIN
  const t = s - m * 2
  const tile = `<rect x="${x + m}" y="${y + m}" width="${t}" height="${t}" rx="${t * TILE_RADIUS}" ry="${t * TILE_RADIUS}" fill="#000"/>`
  const p = t * 0.22
  const k = (t - p * 2) / 128
  return `${open}${quiet}${tile}<g transform="translate(${x + m + p} ${y + m + p + (128 - 124) * k / 2}) scale(${k})"><path d="${TALLY_PATH}" fill="#fff"/></g></g>`
}

/**
 * Rounded style, the default for every code: each dark module is its own round dot, never merged with its
 * neighbours, and the three corner eyes keep the square finder shape with rounded corners on the outer ring
 * and the inner square. Pure black on white, quiet zone of QUIET modules, error correction H.
 */
export const DOT_R = 0.46
/** Corner radii of the eyes, in modules: outer ring (outside and inside edge) and the inner square. */
export const EYE_R = { outer: 2, hole: 1.2, inner: 1 }

const circle = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`
/** A rounded rectangle as path data, clockwise or (for holes) counter-clockwise. */
export function roundRect(x: number, y: number, w: number, h: number, r: number, ccw = false) {
  const q = (n: number) => +n.toFixed(4)
  if (!ccw) return `M${q(x + r)} ${q(y)}h${q(w - 2 * r)}a${r} ${r} 0 0 1 ${r} ${r}v${q(h - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${r}h${q(-(w - 2 * r))}a${r} ${r} 0 0 1 ${-r} ${-r}v${q(-(h - 2 * r))}a${r} ${r} 0 0 1 ${r} ${-r}z`
  return `M${q(x + r)} ${q(y)}a${r} ${r} 0 0 0 ${-r} ${r}v${q(h - 2 * r)}a${r} ${r} 0 0 0 ${r} ${r}h${q(w - 2 * r)}a${r} ${r} 0 0 0 ${r} ${-r}v${q(-(h - 2 * r))}a${r} ${r} 0 0 0 ${-r} ${-r}z`
}

/** Path data for the data modules (eyes drawn separately), in module units, offset by the quiet zone. */
export function modulePath(m: Matrix, withLogo = true) {
  let d = ''
  const al = alignCentres(m)
  for (let y = 0; y < m.size; y++) {
    for (let x = 0; x < m.size; x++) {
      if (!m.get(x, y) || inFinder(m, x, y) || inAlign(al, x, y)) continue
      if (withLogo && inLogo(m, x, y)) continue
      d += circle(x + QUIET + 0.5, y + QUIET + 0.5, DOT_R)
    }
  }
  return d
}

/** Centres of the small alignment patterns, the same positions the QR standard (and the qrcode library) uses. */
export function alignCentres(m: Matrix): [number, number][] {
  const v = m.version
  if (v === 1) return []
  const count = Math.floor(v / 7) + 2
  const step = m.size === 145 ? 26 : Math.ceil((m.size - 13) / (2 * count - 2)) * 2
  const pos = [m.size - 7]
  for (let i = 1; i < count - 1; i++) pos[i] = pos[i - 1] - step
  pos.push(6)
  pos.reverse()
  const out: [number, number][] = []
  for (const y of pos) for (const x of pos) {
    if ((x === 6 && y === 6) || (x === 6 && y === m.size - 7) || (y === 6 && x === m.size - 7)) continue
    if (inLogo(m, x, y)) continue
    out.push([x, y])
  }
  return out
}
const inAlign = (al: [number, number][], x: number, y: number) => al.some(([cx, cy]) => Math.abs(x - cx) <= 2 && Math.abs(y - cy) <= 2)

export const eyeOrigins = (m: Matrix) => [[0, 0], [m.size - 7, 0], [0, m.size - 7]].map(([x, y]) => [x + QUIET, y + QUIET])

/** Corner radii of the small alignment patterns: a rounded 5-module ring around one round dot. */
export const ALIGN_R = { outer: 1.4, hole: 0.8 }

/**
 * The three corner eyes as one path in module units: rounded ring (with its hole drawn the other way round)
 * plus a rounded inner square. The small alignment patterns get the same rounded ring, so scanners still find them.
 */
export function eyePath(m: Matrix) {
  const eyes = eyeOrigins(m).map(([x, y]) =>
    roundRect(x, y, 7, 7, EYE_R.outer) + roundRect(x + 1, y + 1, 5, 5, EYE_R.hole, true) + roundRect(x + 2, y + 2, 3, 3, EYE_R.inner)).join('')
  const aligns = alignCentres(m).map(([cx, cy]) => {
    const x = cx + QUIET - 2, y = cy + QUIET - 2
    return roundRect(x, y, 5, 5, ALIGN_R.outer) + roundRect(x + 1, y + 1, 3, 3, ALIGN_R.hole, true) + circle(x + 2.5, y + 2.5, DOT_R)
  }).join('')
  return eyes + aligns
}

/** The three corner eyes, in black, at `unit` px per module. */
export function finderSvg(m: Matrix, unit: number) {
  return `<path transform="scale(${unit})" d="${eyePath(m)}" fill="${QR_INK}"/>`
}

/** Just the code, no caption. Used on screen and inside the visuals. */
export function codeSvg(url: string, style: QrStyle) {
  return buildSvg({ url, shortLink: '', style, showLink: false }, { caption: false })
}

/** The printable artwork: the code and, if wanted, the short link underneath. No Tally branding on any plan. */
/** `tight`: on screen, the caption box ends right under the link, so spacing below it comes from the layout. */
export function buildSvg(o: QrOptions, opts: { caption?: boolean; tight?: boolean } = {}) {
  const caption = (opts.caption ?? true) && (o.showLink || !!o.label)
  const m = matrix(o.url)
  const unit = 10
  const codeW = (m.size + QUIET * 2) * unit
  const capH = caption ? (opts.tight && o.showLink && !o.label ? 36 : (o.showLink ? 84 : 44) + (o.label && o.showLink ? 36 : 0)) : 0
  const h = codeW + capH
  const logoS = m.size * LOGO_RATIO * unit
  const logoXY = (codeW - logoS) / 2
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${codeW} ${h}" width="${codeW}" height="${h}">`,
    `<rect width="${codeW}" height="${h}" fill="#ffffff"/>`,
    `<g id="QR code">`,
    `<path transform="scale(${unit})" d="${modulePath(m, hasLogo(o.style))}" fill="${QR_INK}"/>`,
    finderSvg(m, unit),
    logoMarkup(o.style, logoXY, logoXY, logoS),
    `</g>`,
  ]
  if (caption) {
    let y = codeW + 24
    if (o.showLink) parts.push(`<text x="${codeW / 2}" y="${y}" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="34" font-weight="600" fill="#37352F">${escapeXml(o.shortLink)}</text>`)
    if (o.label) {
      if (o.showLink) y += 40
      parts.push(`<text x="${codeW / 2}" y="${y}" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="24" fill="#5F5E5A">${escapeXml(o.label)}</text>`)
    }
  }
  parts.push('</svg>')
  return parts.join('')
}

const escapeXml = (s: string) => s.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]!))

export const svgSrc = (svg: string) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)

export function download(blob: Blob, name: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}

async function svgToCanvas(svg: string, scale: number) {
  const img = new Image()
  await new Promise<void>((res, rej) => {
    img.onload = () => res()
    img.onerror = rej
    img.src = svgSrc(svg)
  })
  const c = document.createElement('canvas')
  c.width = img.width * scale
  c.height = img.height * scale
  const ctx = c.getContext('2d')!
  ctx.drawImage(img, 0, 0, c.width, c.height)
  return c
}

/** PNG at least PNG_MIN_PX wide: about 27 cm at 300 dpi, sharp on an A3 poster. */
export async function pngBlob(o: QrOptions): Promise<Blob> {
  const svg = buildSvg(o)
  const w = Number(/width="(\d+)"/.exec(svg)?.[1] ?? 400)
  const h = Number(/height="(\d+)"/.exec(svg)?.[1] ?? 400)
  // Rasterise the vector at print size, so the round dots and eyes stay smooth.
  const k = Math.ceil(PNG_MIN_PX / w)
  const big = svg.replace(`width="${w}" height="${h}"`, `width="${w * k}" height="${h * k}"`)
  const c = await svgToCanvas(big, 1)
  return new Promise((res) => c.toBlob((b) => res(b!), 'image/png'))
}

/** PDF on A4, code centred at 12 cm. Modules are vector, so it scales to any paper size. The logo tile is a sharp image. */
export async function pdfBlob(o: QrOptions): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const m = matrix(o.url)
  const total = PDF_CODE_MM
  const unit = total / (m.size + QUIET * 2)
  const x0 = (210 - total) / 2
  const y0 = Math.max(20, (297 - total) / 2 - 20)
  // Same rounded style as the SVG, as vector shapes: round dots, and eyes as rounded squares.
  const al = alignCentres(m)
  doc.setFillColor(0, 0, 0)
  for (let y = 0; y < m.size; y++)
    for (let x = 0; x < m.size; x++)
      if (m.get(x, y) && !(hasLogo(o.style) && inLogo(m, x, y)) && !inFinder(m, x, y) && !inAlign(al, x, y))
        doc.circle(x0 + (x + QUIET + 0.5) * unit, y0 + (y + QUIET + 0.5) * unit, DOT_R * unit, 'F')
  for (const [ex, ey] of eyeOrigins(m)) {
    const x = x0 + ex * unit
    const y = y0 + ey * unit
    doc.setFillColor(0, 0, 0); doc.roundedRect(x, y, 7 * unit, 7 * unit, EYE_R.outer * unit, EYE_R.outer * unit, 'F')
    doc.setFillColor(255, 255, 255); doc.roundedRect(x + unit, y + unit, 5 * unit, 5 * unit, EYE_R.hole * unit, EYE_R.hole * unit, 'F')
    doc.setFillColor(0, 0, 0); doc.roundedRect(x + 2 * unit, y + 2 * unit, 3 * unit, 3 * unit, EYE_R.inner * unit, EYE_R.inner * unit, 'F')
  }
  for (const [cx, cy] of al) {
    const x = x0 + (cx + QUIET - 2) * unit
    const y = y0 + (cy + QUIET - 2) * unit
    doc.setFillColor(0, 0, 0); doc.roundedRect(x, y, 5 * unit, 5 * unit, ALIGN_R.outer * unit, ALIGN_R.outer * unit, 'F')
    doc.setFillColor(255, 255, 255); doc.roundedRect(x + unit, y + unit, 3 * unit, 3 * unit, ALIGN_R.hole * unit, ALIGN_R.hole * unit, 'F')
    doc.setFillColor(0, 0, 0); doc.circle(x + 2.5 * unit, y + 2.5 * unit, DOT_R * unit, 'F')
  }
  if (hasLogo(o.style)) {
    // Logo tile, rendered from the same SVG markup.
    const logoS = m.size * LOGO_RATIO
    const tile = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">${logoMarkup(o.style, 0, 0, 100)}</svg>`
    const c = await svgToCanvas(tile, 6)
    const lx = x0 + (QUIET + (m.size - logoS) / 2) * unit
    doc.addImage(c.toDataURL('image/png'), 'PNG', lx, y0 + (QUIET + (m.size - logoS) / 2) * unit, logoS * unit, logoS * unit)
  }
  const fs = Math.max(9, Math.min(28, total / 5))
  let ty = y0 + total + fs * 0.35 + 2
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(fs)
  doc.setTextColor(55, 53, 47)
  if (o.showLink) doc.text(o.shortLink, 105, ty, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  if (o.label) {
    ty += fs * 0.5
    doc.setFontSize(Math.max(7, fs * 0.6))
    doc.setTextColor(95, 94, 90)
    doc.text(o.label, 105, ty, { align: 'center' })
  }
  return doc.output('blob')
}

export async function fileFor(o: QrOptions, format: QrFormat): Promise<Blob> {
  if (format === 'svg') return new Blob([buildSvg(o)], { type: 'image/svg+xml' })
  if (format === 'pdf') return pdfBlob(o)
  return pngBlob(o)
}

