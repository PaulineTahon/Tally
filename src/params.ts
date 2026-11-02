/** Prototype only: the version, Social layout and tracking view you picked travel with you from screen to screen. */
const KEEP = ['variant', 'social', 'track'] as const

/** `extra` like `?state=noqr`; the current ?variant= and ?social= are added unless `extra` sets them. */
export function keepParams(extra = ''): string {
  const cur = new URLSearchParams(window.location.hash.split('?')[1] ?? '')
  const p = new URLSearchParams(extra.replace(/^\?/, ''))
  for (const k of KEEP) { const v = cur.get(k); if (v && !p.has(k)) p.set(k, v) }
  const qs = p.toString()
  return qs ? `?${qs}` : ''
}

/** A hash link to a screen that keeps the version, like `#/insights?focus=qr&variant=jobs`. */
export const screenHref = (path: string, extra = '') => `#${path}${keepParams(extra)}`
