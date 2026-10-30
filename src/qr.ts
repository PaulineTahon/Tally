import QRCode from 'qrcode'
import { TALLY_PATH } from './mark'

export type QrSize = 'small' | 'medium' | 'large'
export const SIZES: Record<QrSize, { label: string; hint: string; mm: number }> = {
  small: { label: 'Small', hint: 'Sticker', mm: 30 },
  medium: { label: 'Medium', hint: 'Flyer', mm: 60 },
  large: { label: 'Large', hint: 'Poster', mm: 150 },
}
export type QrFormat = 'svg' | 'pdf' | 'png'

/** Plain black is the default. "Your brand" adds the creator's colour and logo. */
export interface QrStyle {
  mode: 'tally' | 'brand'
  color: string
  /** Data URL of an uploaded logo, or null for the sample logo. */
  logo: string | null
}
export const DEFAULT_STYLE: QrStyle = { mode: 'tally', color: '#2E6B4F', logo: null }

export interface QrOptions {
  url: string
  shortLink: string
  style: QrStyle
  madeWithTally: boolean
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
export const LOGO_RATIO = 0.22

export function inLogo(m: Matrix, x: number, y: number) {
  const c = m.size / 2
  const half = (m.size * LOGO_RATIO) / 2 + 0.5
  return Math.abs(x + 0.5 - c) < half && Math.abs(y + 0.5 - c) < half
}

export function inFinder(m: Matrix, x: number, y: number) {
  const n = m.size
  return (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7)
}

/** Sample logo for "Your brand": a picnic basket on a rounded tile. */
function sampleLogo(x: number, y: number, s: number, color: string) {
  const k = s / 24
  return `<g transform="translate(${x} ${y}) scale(${k})">
  <rect x="0" y="0" width="24" height="24" rx="6" fill="${color}"/>
  <path d="M5 11h14l-1.6 7.2a1.5 1.5 0 0 1-1.5 1.2H8.1a1.5 1.5 0 0 1-1.5-1.2Z" fill="#fff"/>
  <path d="M8 11c0-3 1.8-5 4-5s4 2 4 5" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>
</g>`
}

/** Free plan: a small Tally mark in the corner of the code area, never on the modules. */
function cornerMark(x: number, y: number, s: number) {
  const k = s / 128
  return `<g transform="translate(${x} ${y}) scale(${k})"><path d="${TALLY_PATH}" fill="#000"/></g>`
}

export const hasLogo = (st: QrStyle) => st.mode === 'brand'

function logoMarkup(st: QrStyle, x: number, y: number, s: number) {
  if (st.mode === 'tally') return ''
  if (st.logo) {
    return `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${s * 0.22}" fill="#fff"/>
<image href="${st.logo}" x="${x + s * 0.08}" y="${y + s * 0.08}" width="${s * 0.84}" height="${s * 0.84}" preserveAspectRatio="xMidYMid meet"/>`
  }
  return sampleLogo(x, y, s, st.color)
}

export const moduleColor = (st: QrStyle) => (st.mode === 'tally' ? '#000000' : st.color)
export const accentColor = (st: QrStyle) => moduleColor(st)

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

/** The three corner eyes: outer ring in the main colour, centre in the accent. */
export function finderSvg(m: Matrix, unit: number, main: string, accent: string) {
  const n = m.size
  return [[0, 0], [n - 7, 0], [0, n - 7]].map(([fx, fy]) => {
    const x = (fx + QUIET) * unit
    const y = (fy + QUIET) * unit
    return `<path d="M${x} ${y}h${7 * unit}v${7 * unit}h${-7 * unit}z M${x + unit} ${y + unit}v${5 * unit}h${5 * unit}v${-5 * unit}z" fill="${main}" fill-rule="evenodd"/>` +
      `<rect x="${x + 2 * unit}" y="${y + 2 * unit}" width="${3 * unit}" height="${3 * unit}" fill="${accent}"/>`
  }).join('')
}

/** Just the code, no caption. Used on screen and inside the visuals. */
export function codeSvg(url: string, style: QrStyle) {
  return buildSvg({ url, shortLink: '', style, madeWithTally: false }, { caption: false })
}

/** The printable artwork: code, short link underneath and the free plan mark. */
export function buildSvg(o: QrOptions, opts: { caption?: boolean } = {}) {
  const caption = opts.caption ?? true
  const m = matrix(o.url)
  const unit = 10
  const codeW = (m.size + QUIET * 2) * unit
  const capH = caption ? 84 + (o.label ? 36 : 0) + (o.madeWithTally ? 36 : 0) : 0
  const h = codeW + capH
  const logoS = m.size * LOGO_RATIO * unit
  const logoXY = (codeW - logoS) / 2
  const main = moduleColor(o.style)
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${codeW} ${h}" width="${codeW}" height="${h}">`,
    `<rect width="${codeW}" height="${h}" fill="#ffffff"/>`,
    `<path transform="scale(${unit})" d="${modulePath(m, hasLogo(o.style))}" fill="${main}" shape-rendering="crispEdges"/>`,
    finderSvg(m, unit, main, accentColor(o.style)),
    logoMarkup(o.style, logoXY, logoXY, logoS),
  ]
  if (o.madeWithTally && caption) {
    // Bottom-right corner of the white code area, in the margin and clear of the modules.
    const ms = unit * 2.2
    const xy = codeW - QUIET * unit + unit * 1.4
    parts.push(cornerMark(xy, xy, ms))
  }
  if (caption) {
    let y = codeW + 24
    parts.push(`<text x="${codeW / 2}" y="${y}" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="34" font-weight="600" fill="#37352F">${o.shortLink}</text>`)
    if (o.label) {
      y += 40
      parts.push(`<text x="${codeW / 2}" y="${y}" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="24" fill="#5F5E5A">${escapeXml(o.label)}</text>`)
    }
    if (o.madeWithTally) {
      y += 44
      parts.push(`<text x="${codeW / 2}" y="${y}" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="22" fill="#777672">Made with Tally</text>`)
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

export async function pngBlob(o: QrOptions, scale = 4): Promise<Blob> {
  const c = await svgToCanvas(buildSvg(o), scale)
  return new Promise((res) => c.toBlob((b) => res(b!), 'image/png'))
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number]
}

/** PDF on A4, code centred at the chosen print size. Modules are vector, the logo tile is a sharp image. */
export async function pdfBlob(o: QrOptions, size: QrSize): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const m = matrix(o.url)
  const total = SIZES[size].mm
  const unit = total / (m.size + QUIET * 2)
  const x0 = (210 - total) / 2
  const y0 = Math.max(20, (297 - total) / 2 - 20)
  const fill = (hex: string) => { const [r, g, b] = hexToRgb(hex); doc.setFillColor(r, g, b) }
  const main = moduleColor(o.style)
  fill(main)
  for (let y = 0; y < m.size; y++)
    for (let x = 0; x < m.size; x++)
      if (m.get(x, y) && !(hasLogo(o.style) && inLogo(m, x, y)) && !inFinder(m, x, y))
        doc.rect(x0 + (x + QUIET) * unit, y0 + (y + QUIET) * unit, unit + 0.01, unit + 0.01, 'F')
  for (const [fx, fy] of [[0, 0], [m.size - 7, 0], [0, m.size - 7]]) {
    const x = x0 + (fx + QUIET) * unit
    const y = y0 + (fy + QUIET) * unit
    fill(main)
    doc.rect(x, y, 7 * unit, unit, 'F'); doc.rect(x, y + 6 * unit, 7 * unit, unit, 'F')
    doc.rect(x, y, unit, 7 * unit, 'F'); doc.rect(x + 6 * unit, y, unit, 7 * unit, 'F')
    fill(accentColor(o.style))
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
  doc.text(o.shortLink, 105, ty, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  if (o.label) {
    ty += fs * 0.5
    doc.setFontSize(Math.max(7, fs * 0.6))
    doc.setTextColor(95, 94, 90)
    doc.text(o.label, 105, ty, { align: 'center' })
  }
  if (o.madeWithTally) {
    ty += fs * 0.5
    doc.setFontSize(Math.max(7, fs * 0.55))
    doc.setTextColor(119, 118, 114)
    doc.text('Made with Tally', 105, ty, { align: 'center' })
    const ms = unit * 2.2
    const off = (m.size + QUIET) * unit + unit * 1.4
    const mk = await svgToCanvas(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 124" width="128" height="124"><path d="${TALLY_PATH}" fill="#000"/></svg>`, 2)
    doc.addImage(mk.toDataURL('image/png'), 'PNG', x0 + off, y0 + off, ms, ms * 124 / 128)
  }
  return doc.output('blob')
}

export async function fileFor(o: QrOptions, format: QrFormat, size: QrSize): Promise<Blob> {
  if (format === 'svg') return new Blob([buildSvg(o)], { type: 'image/svg+xml' })
  if (format === 'pdf') return pdfBlob(o, size)
  return pngBlob(o, size === 'small' ? 2 : size === 'medium' ? 4 : 8)
}

/** WCAG contrast ratio of a colour against white. */
export function contrastOnWhite(hex: string) {
  const lum = hexToRgb(hex)
    .map((v) => v / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  const L = 0.2126 * lum[0] + 0.7152 * lum[1] + 0.0722 * lum[2]
  return 1.05 / (L + 0.05)
}
