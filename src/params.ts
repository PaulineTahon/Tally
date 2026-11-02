/** Prototype only: the version and Social layout you picked travel with you from screen to screen. */
const KEEP = ['variant', 'social'] as const

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

/** Every share sheet layout, by its ?variant= value. Simple is the default. */
export const ALL_VARIANTS = ['simple', 'split', 'tabs', 'entry', 'tiles', 'jobs'] as const
export type VariantId = (typeof ALL_VARIANTS)[number]
/**
 * The layouts this build offers. A build can set VITE_VARIANTS (like `simple,split`) to offer only some of them;
 * without it, all six. Simple is always there, as the default.
 */
export const VARIANTS: readonly VariantId[] = (() => {
  const want = String(import.meta.env.VITE_VARIANTS ?? '').split(',').map((v) => v.trim()).filter(Boolean)
  if (!want.length) return ALL_VARIANTS
  return ALL_VARIANTS.filter((v) => v === 'simple' || want.includes(v))
})()
/** The layout in the link. Anything missing, unknown or not offered in this build is Simple. */
export function currentVariant(): VariantId {
  const m = /[?&]variant=([a-z]+)/.exec(window.location.hash + window.location.search)
  const v = m?.[1] as VariantId | undefined
  return v && VARIANTS.includes(v) ? v : 'simple'
}
