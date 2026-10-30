import QRCode from 'qrcode'

export type QrSize = 'small' | 'medium' | 'large'
export const SIZES: Record<QrSize, { label: string; hint: string; mm: number }> = {
  small: { label: 'Small', hint: 'Sticker', mm: 30 },
  medium: { label: 'Medium', hint: 'Flyer', mm: 60 },
  large: { label: 'Large', hint: 'Poster', mm: 150 },
}

export interface QrOptions {
  url: string
  shortLink: string
  color: string
  logo: boolean
  madeWithTally: boolean
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

const QUIET = 4
/** Share of the code width covered by the logo badge. Small enough for level H. */
export const LOGO_RATIO = 0.22

function inLogo(m: Matrix, x: number, y: number) {
  const c = m.size / 2
  const half = (m.size * LOGO_RATIO) / 2 + 0.5
  return Math.abs(x + 0.5 - c) < half && Math.abs(y + 0.5 - c) < half
}

/** Logo used in the prototype: a small picnic basket mark on a rounded tile. */
export function logoSvg(x: number, y: number, s: number, color: string) {
  const k = s / 24
  return `<g transform="translate(${x} ${y}) scale(${k})">
  <rect x="0" y="0" width="24" height="24" rx="6" fill="${color}"/>
  <path d="M5 11h14l-1.6 7.2a1.5 1.5 0 0 1-1.5 1.2H8.1a1.5 1.5 0 0 1-1.5-1.2Z" fill="#fff"/>
  <path d="M8 11c0-3 1.8-5 4-5s4 2 4 5" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>
</g>`
}

/** Path data for the dark modules, in module units, offset by the quiet zone. */
export function modulePath(m: Matrix, withLogo: boolean) {
  let d = ''
  for (let y = 0; y < m.size; y++) {
    for (let x = 0; x < m.size; x++) {
      if (!m.get(x, y)) continue
      if (withLogo && inLogo(m, x, y)) continue
      d += `M${x + QUIET} ${y + QUIET}h1v1h-1z`
    }
  }
  return d
}

/** The printable artwork: code, short link underneath and the optional free plan mark. */
export function buildSvg(o: QrOptions, opts: { caption?: boolean } = {}) {
  const caption = opts.caption ?? true
  const m = matrix(o.url)
  const unit = 10
  const codeW = (m.size + QUIET * 2) * unit
  const capH = caption ? (o.madeWithTally ? 120 : 84) : 0
  const h = codeW + capH
  const logoS = m.size * LOGO_RATIO * unit
  const logoXY = (codeW - logoS) / 2
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${codeW} ${h}" width="${codeW}" height="${h}">`,
    `<rect width="${codeW}" height="${h}" fill="#ffffff"/>`,
    `<path transform="scale(${unit})" d="${modulePath(m, o.logo)}" fill="${o.color}" shape-rendering="crispEdges"/>`,
    o.logo ? logoSvg(logoXY, logoXY, logoS, o.color) : '',
  ]
  if (caption) {
    parts.push(
      `<text x="${codeW / 2}" y="${codeW + 24}" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="34" font-weight="600" fill="#37352F">${o.shortLink}</text>`,
    )
    if (o.madeWithTally) {
      parts.push(
        `<text x="${codeW / 2}" y="${codeW + 76}" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="22" fill="#777672">Made with Tally</text>`,
      )
    }
  }
  parts.push('</svg>')
  return parts.join('')
}

export function download(blob: Blob, name: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}

export async function pngBlob(o: QrOptions, scale = 4): Promise<Blob> {
  const svg = buildSvg(o)
  const img = new Image()
  const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
  await new Promise<void>((res, rej) => {
    img.onload = () => res()
    img.onerror = rej
    img.src = src
  })
  const c = document.createElement('canvas')
  c.width = img.width * scale
  c.height = img.height * scale
  const ctx = c.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(img, 0, 0, c.width, c.height)
  return new Promise((res) => c.toBlob((b) => res(b!), 'image/png'))
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number]
}

/** Vector PDF on A4, code centred at the chosen print size. */
export async function pdfBlob(o: QrOptions, size: QrSize): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const m = matrix(o.url)
  const total = SIZES[size].mm
  const unit = total / (m.size + QUIET * 2)
  const x0 = (210 - total) / 2
  const y0 = Math.max(20, (297 - total) / 2 - 20)
  const [r, g, b] = hexToRgb(o.color)
  doc.setFillColor(r, g, b)
  for (let y = 0; y < m.size; y++)
    for (let x = 0; x < m.size; x++)
      if (m.get(x, y) && !(o.logo && inLogo(m, x, y)))
        doc.rect(x0 + (x + QUIET) * unit, y0 + (y + QUIET) * unit, unit + 0.01, unit + 0.01, 'F')
  if (o.logo) {
    const s = m.size * LOGO_RATIO * unit
    const lx = x0 + (total - s) / 2
    const ly = y0 + (total - s) / 2
    doc.roundedRect(lx, ly, s, s, s / 4, s / 4, 'F')
    doc.setFillColor(255, 255, 255)
    doc.triangle(lx + s * 0.21, ly + s * 0.46, lx + s * 0.79, ly + s * 0.46, lx + s * 0.5, ly + s * 0.8, 'F')
    doc.rect(lx + s * 0.27, ly + s * 0.46, s * 0.46, s * 0.33, 'F')
  }
  const fs = Math.max(9, Math.min(28, total / 5))
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(fs)
  doc.setTextColor(55, 53, 47)
  doc.text(o.shortLink, 105, y0 + total + fs * 0.35 + 2, { align: 'center' })
  if (o.madeWithTally) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(Math.max(7, fs * 0.55))
    doc.setTextColor(119, 118, 114)
    doc.text('Made with Tally', 105, y0 + total + fs * 0.35 + 4 + fs * 0.45, { align: 'center' })
  }
  return doc.output('blob')
}

/** WCAG contrast ratio of a colour against white. */
export function contrastOnWhite(hex: string) {
  const lum = hexToRgb(hex)
    .map((v) => v / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  const L = 0.2126 * lum[0] + 0.7152 * lum[1] + 0.0722 * lum[2]
  return 1.05 / (L + 0.05)
}
