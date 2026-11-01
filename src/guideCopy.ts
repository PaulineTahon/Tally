/** Every string in the prototype guide card, in one place for copy review. */

export type GuidePage = 'publish' | 'share' | 'insights-data' | 'insights-noqr' | 'insights-empty' | 'visuals'

export const guideCopy = {
  label: 'Prototype Guide',
  caseStudy: 'Read the case study',
  caseStudyUrl: 'https://app.notion.com/p/4099896a397581e7b66dccd672de63bb',
  counter: (n: number, total: number) => `${n} of ${total} tried`,
  mobileToggle: (n: number) => `What to try (${n})`,
  restore: 'Guide',
  dismiss: 'Hide the guide on this page',
  pages: {
    publish: {
      title: 'Start Here',
      items: [
        { id: 'publish-copy', text: 'Publish, then hit Copy.' },
        { id: 'download-main', text: 'Download your QR code from the QR Code tab.' },
      ],
    },
    share: {
      title: 'Everything You Share, in One Place',
      items: [
        { id: 'link-ending', text: 'Use custom domain, under your link, adds your own domain and ending.' },
        { id: 'add-code', text: 'Open your QR code and add another code for a poster.' },
      ],
    },
    'insights-data': {
      title: 'See What Worked',
      items: [
        { id: 'compare-sources', text: 'Compare QR Code, Poster and Flyer in Sources.' },
        { id: 'switch-states', text: 'Switch states in the prototype bar.' },
      ],
    },
    'insights-noqr': {
      title: 'See What Worked',
      items: [{ id: 'switch-states', text: 'Switch states in the prototype bar.' }],
    },
    'insights-empty': {
      title: 'No Responses Yet',
      items: [{ id: 'go-share', text: 'Go to Share and send it somewhere.' }],
    },
    visuals: {
      title: 'The Announcement',
      items: [{ id: 'scan', text: 'Scan a code with your phone. Responses from it are tagged with where it was placed.' }],
    },
  } satisfies Record<GuidePage, { title: string; items: { id: string; text: string }[] }>,
}
