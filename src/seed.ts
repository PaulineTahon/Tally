/**
 * One set of example numbers for the whole prototype: the Share tab, the QR Code tab and Insights
 * all read from here, so names and counts match everywhere.
 * all = all time, d7 = last 7 days, h24 = last 24 hours, as [visits, responses].
 */
export type Range = '24h' | '7d' | '30d' | 'all'
export type Counts = Record<'all' | 'd7' | 'h24', [number, number]>

export interface SeedPlace { ref: string; label: string; kind: 'qr' | 'social' | 'email' | 'custom'; counts: Counts }

export const MAIN_QR = 'qr'

/** Copy message and link tags the link with this ref. Insights calls it Copied message. */
export const MESSAGE_REF = 'message'

/** Insights label for a ref it doesn't recognise. */
export const OTHER_LABEL = 'Other'

export const SEED: SeedPlace[] = [
  { ref: 'whatsapp', label: 'WhatsApp', kind: 'social', counts: { all: [14, 4], d7: [5, 1], h24: [0, 0] } },
  { ref: MAIN_QR, label: 'Main code', kind: 'qr', counts: { all: [6, 1], d7: [3, 1], h24: [2, 1] } },
  { ref: 'qr-poster', label: 'Poster', kind: 'qr', counts: { all: [5, 2], d7: [3, 1], h24: [0, 0] } },
  { ref: 'qr-flyer', label: 'Flyer', kind: 'qr', counts: { all: [5, 1], d7: [2, 1], h24: [0, 0] } },
  { ref: 'email', label: 'Email', kind: 'email', counts: { all: [5, 2], d7: [1, 0], h24: [0, 0] } },
  { ref: 'instagram', label: 'Instagram', kind: 'social', counts: { all: [2, 1], d7: [0, 0], h24: [0, 0] } },
  { ref: 'linkedin', label: 'LinkedIn', kind: 'social', counts: { all: [1, 0], d7: [0, 0], h24: [0, 0] } },
  { ref: 'facebook', label: 'Facebook', kind: 'social', counts: { all: [1, 0], d7: [0, 0], h24: [0, 0] } },
  { ref: 'x', label: 'X', kind: 'social', counts: { all: [1, 0], d7: [0, 0], h24: [0, 0] } },
  { ref: MESSAGE_REF, label: 'Copied message', kind: 'custom', counts: { all: [2, 0], d7: [0, 0], h24: [0, 0] } },
]

/** Responses with no ?ref. Insights calls this row Direct / None. */
export const DIRECT: Counts = { all: [7, 1], d7: [3, 0], h24: [1, 0] }

/** A fresh form: only the main code, nothing in yet. */
export const FRESH: SeedPlace[] = [{ ref: MAIN_QR, label: 'Main code', kind: 'qr', counts: { all: [0, 0], d7: [0, 0], h24: [0, 0] } }]

export const ZERO: Counts = { all: [0, 0], d7: [0, 0], h24: [0, 0] }

export const rangeKey = (r: Range): keyof Counts => (r === '24h' ? 'h24' : r === '7d' ? 'd7' : 'all')
