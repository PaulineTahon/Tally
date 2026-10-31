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
  get: (x: number, y: number) => boolean
}

export function matrix(url: string): Matrix {
  // Level H keeps the code readable with a logo in the middle.
  const qr = QRCode.create(url, { errorCorrectionLevel: 'H' })
  const size = qr.modules.size
  const data = qr.modules.data
  return { size, get: (x, y) => data[y * size + x] === 1 }
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

/** Rounded square knockout: corner radius about a quarter of its side. */
export const TILE_RADIUS = 0.24

/**
 * The centre mark: a black Tally asterisk on a white rounded square, on every plan.
 * A logo uploaded in Personalize replaces it. Padding is even on all sides.
 */
export function logoMarkup(st: QrStyle, x: number, y: number, s: number) {
  const tile = `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${s * TILE_RADIUS}" ry="${s * TILE_RADIUS}" fill="#fff"/>`
  if (st.logo) {
    const p = s * 0.14
    return `${tile}<image href="${st.logo}" x="${x + p}" y="${y + p}" width="${s - p * 2}" height="${s - p * 2}" preserveAspectRatio="xMidYMid meet"/>`
  }
  const p = s * 0.2
  const k = (s - p * 2) / 128
  return `${tile}<g transform="translate(${x + p} ${y + p + (128 - 124) * k / 2}) scale(${k})"><path d="${TALLY_PATH}" fill="#000"/></g>`
}

/** Path data for the data modules (finders drawn separately), in module units, offset by the quiet zone. */
export function modulePath(m: Matrix, withLogo = true, withFinders = false) {
  let d = ''
  for (let y = 0; y < m.size; y++) {
    for (let x = 0; x < m.size; x++) {
      if (!m.get(x, y)) continue
      if (!withFinders && inFinder(m, x, y)) continue
      if (withLogo && inLogo(m, x, y)) continue
      d += `M${x + QUIET} ${y + QUIET}h1v1h-1z`
    }
  }
  return d
}

/** The three corner eyes, in black. */
export function finderSvg(m: Matrix, unit: number) {
  const n = m.size
  return [[0, 0], [n - 7, 0], [0, n - 7]].map(([fx, fy]) => {
    const x = (fx + QUIET) * unit
    const y = (fy + QUIET) * unit
    return `<path d="M${x} ${y}h${7 * unit}v${7 * unit}h${-7 * unit}z M${x + unit} ${y + unit}v${5 * unit}h${5 * unit}v${-5 * unit}z" fill="${QR_INK}" fill-rule="evenodd"/>` +
      `<rect x="${x + 2 * unit}" y="${y + 2 * unit}" width="${3 * unit}" height="${3 * unit}" fill="${QR_INK}"/>`
  }).join('')
}

/** Just the code, no caption. Used on screen and inside the visuals. */
export function codeSvg(url: string, style: QrStyle) {
  return buildSvg({ url, shortLink: '', style, showLink: false }, { caption: false })
}

/** The printable artwork: the code and, if wanted, the short link underneath. No Tally branding on any plan. */
export function buildSvg(o: QrOptions, opts: { caption?: boolean } = {}) {
  const caption = (opts.caption ?? true) && (o.showLink || !!o.label)
  const m = matrix(o.url)
  const unit = 10
  const codeW = (m.size + QUIET * 2) * unit
  const capH = caption ? (o.showLink ? 84 : 44) + (o.label && o.showLink ? 36 : 0) : 0
  const h = codeW + capH
  const logoS = m.size * LOGO_RATIO * unit
  const logoXY = (codeW - logoS) / 2
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${codeW} ${h}" width="${codeW}" height="${h}">`,
    `<rect width="${codeW}" height="${h}" fill="#ffffff"/>`,
    `<path transform="scale(${unit})" d="${modulePath(m, hasLogo(o.style))}" fill="${QR_INK}" shape-rendering="crispEdges"/>`,
    finderSvg(m, unit),
    logoMarkup(o.style, logoXY, logoXY, logoS),
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
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(img, 0, 0, c.width, c.height)
  return c
}

/** PNG at least PNG_MIN_PX wide: about 27 cm at 300 dpi, sharp on an A3 poster. */
export async function pngBlob(o: QrOptions): Promise<Blob> {
  const svg = buildSvg(o)
  const w = Number(/width="(\d+)"/.exec(svg)?.[1] ?? 400)
  const c = await svgToCanvas(svg, Math.ceil(PNG_MIN_PX / w))
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
  doc.setFillColor(0, 0, 0)
  for (let y = 0; y < m.size; y++)
    for (let x = 0; x < m.size; x++)
      if (m.get(x, y) && !(hasLogo(o.style) && inLogo(m, x, y)) && !inFinder(m, x, y))
        doc.rect(x0 + (x + QUIET) * unit, y0 + (y + QUIET) * unit, unit + 0.01, unit + 0.01, 'F')
  for (const [fx, fy] of [[0, 0], [m.size - 7, 0], [0, m.size - 7]]) {
    const x = x0 + (fx + QUIET) * unit
    const y = y0 + (fy + QUIET) * unit
    doc.rect(x, y, 7 * unit, unit, 'F'); doc.rect(x, y + 6 * unit, 7 * unit, unit, 'F')
    doc.rect(x, y, unit, 7 * unit, 'F'); doc.rect(x + 6 * unit, y, unit, 7 * unit, 'F')
    doc.rect(x + 2 * unit, y + 2 * unit, 3 * unit, 3 * unit, 'F')
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

