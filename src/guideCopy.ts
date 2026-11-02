/** Every string in the prototype guide card, in one place for copy review. */

export type GuidePage = 'publish' | 'share' | 'insights-data' | 'insights-noqr' | 'insights-empty' | 'visuals'

/** `simple`: what the item reads in Simple instead, or null to leave it out there (Simple has one code). */
type GuideItem = { id: string; text: string; simple?: string | null }

export const guideCopy = {
  label: 'Prototype Guide',
  caseStudy: 'Read the proposal',
  caseStudyUrl: 'https://app.notion.com/p/40b9896a397581fba1cdf447c04037ec',
  counter: (n: number, total: number) => `${n} of ${total} tried`,
  mobileToggle: (n: number) => `What to try (${n})`,
  restore: 'Guide',
  dismiss: 'Hide the guide on this page',
  pages: {
    publish: {
      title: 'Start here',
      items: [
        { id: 'publish-copy', text: 'Publish, then hit Copy.' },
        { id: 'download-main', text: 'Download your QR code from the QR Code tab.', simple: 'Open your QR code from the button next to Copy.' },
      ],
    },
    share: {
      title: 'Everything you share, in one place',
      items: [
        { id: 'link-ending', text: 'Add your own domain under your link.' },
        { id: 'add-code', text: 'Add another code for a poster.', simple: null },
      ],
    },
    'insights-data': {
      title: 'See what worked',
      items: [
        { id: 'compare-sources', text: 'Compare QR Code, Poster and Flyer in Sources.', simple: 'See how many responses came from your QR code.' },
        { id: 'switch-states', text: 'Switch states in the prototype bar.' },
      ],
    },
    'insights-noqr': {
      title: 'See what worked',
      items: [{ id: 'switch-states', text: 'Switch states in the prototype bar.' }],
    },
    'insights-empty': {
      title: 'No responses yet',
      items: [{ id: 'go-share', text: 'Go to Share and send it somewhere.' }],
    },
    visuals: {
      title: 'The announcement',
      items: [{ id: 'scan', text: 'Scan a code with your phone. Responses from it are tagged with where it was placed.' }],
    },
  } satisfies Record<GuidePage, { title: string; items: GuideItem[] }>,
}
