/** UI strings, kept together for copy review. */

/** Title of the demo form every printed code opens. One place, so a new title is a one-line change. */
export const EGG_TITLE = 'Scanned your way here'

export const rowCopy = {
  download: (place: string, format: string) => `Download ${place} as ${format.toUpperCase()}`,
  copyLink: 'Copy link',
  openLink: 'Open link',
  rename: 'Rename',
  remove: 'Remove from list',
  renamed: (place: string) => (place.length > 24 ? 'Code renamed' : `Renamed to ${place}`),
  removed: 'Removed. The code still works and its responses stay tagged.',
  undo: 'Undo',
  /** Visits and submissions, like the Sources panel in Insights. */
  visits: (v: number) => `${v} ${v === 1 ? 'visit' : 'visits'}`,
  submissions: (n: number) => `${n} ${n === 1 ? 'submission' : 'submissions'}`,
  cancel: 'Cancel',
}

/** Link ending: old endings keep redirecting, and stay reserved for this form. */
/**
 * Shown under the fields in Link ending and domain, always. Wording to confirm with product.
 * `{link}` is the form ID link, which stays live whatever ending or domain you add.
 */
export const OLD_LINK_NOTE = "Your old link {link} keeps working, and so do QR codes you've already printed."
/** Only when you change a custom ending you had already saved. `{link}` is that old address. */
export const ENDING_GONE_NOTE = "Custom links you've already shared stop working."

export const endingCopy = {
  label: 'Link Ending',
  help: 'Pick your own ending on your domain, like forms.yourdomain.com/{ending}.',
  newLink: 'New link',
  yourLink: 'Your link',
  save: 'Save',
  cancel: 'Cancel',
  updated: 'Link updated.',
}

/** Link options, opened in context: the pencil on the link and Customize on the preview card. Pro is shown with a badge on a label, never on a button. */
export const linkCopy = {
  endingRow: 'Link ending and domain',
  previewRow: 'Link preview',
  customize: 'Customize preview',
  back: 'Back',
  domainHelp: 'Use your own domain, like forms.yourdomain.com.',
  previewHelp: 'This is what people see when you paste the link in a chat or a post.',
}

/** Embed tab. */
export const embedCopy = {
  intro: 'Pick how the form shows up on your site.',
  desktop: 'Works best on desktop.',
  help: 'How embedding works',
  helpUrl: 'https://tally.so/help/embed-your-form',
  newTab: '(opens in a new tab)',
}

/** Tally's upgrade screen, word for word. Euro prices as Tally shows them in Belgium. */
export const upgradeCopy = {
  back: 'Back',
  close: 'Close',
  sub: 'Upgrade to access advanced features designed for growing teams and creators.',
  monthly: 'Pay monthly',
  yearly: 'Pay yearly',
  off: '2 months off',
  perMonth: 'per month',
  upgradePro: 'Upgrade to Pro',
  upgradeBusiness: 'Upgrade to Business',
  pro: { month: { price: 25, pay: 'Pay €25 Every Month' }, year: { price: 20, pay: 'Pay €250 Every Year' } },
  business: { month: { price: 79, pay: 'Pay €79 Every Month' }, year: { price: 65, pay: 'Pay €790 Every Year' } },
  proFeats: [
    ['Remove Tally branding.', 'Hide all branding and make your forms truly your own.'],
    ['Custom domains.', 'Host forms on your custom (sub)domain to create branded links.'],
    ['Collaboration.', 'Invite unlimited team members to shared workspaces.'],
    ['Partial submissions.', 'Capture unfinished form responses before respondents submit your form.'],
    ['Advanced customization.', 'Customize your forms with built-in design options.'],
    ['Custom CSS.', 'Inject custom CSS to fully control your form design.'],
  ] as [string, string][],
  bizFeats: [
    ['Everything in Pro.', 'Plus the following features tailored for organizations with advanced needs.'],
    ['Control data retention.', 'Automatically delete form submissions after a set period to comply with privacy frameworks.'],
    ['Verify emails.', "Confirm respondents' email addresses to capture high-quality leads and increase conversions."],
  ] as [string, string][],
}

/** Tally's Embed page, with Tally's own labels. */
export const embedPageCopy = {
  title: 'Embed',
  close: 'Close',
  type: 'Embed type',
  getCode: 'Get the code',
  backToPreview: 'Back to preview',
  copyEmbedLink: 'Copy embed link',
  embedLinkCopied: 'Embed link copied.',
  options: 'Options',
  help: 'Help',
  height: 'Height',
  dynamicHeight: 'Dynamic height',
  hideTitle: 'Hide form title',
  alignLeft: 'Align content to the left',
  transparent: 'Transparent background',
  open: 'Open',
  openOptions: ['On button click', 'On page load', 'After elapsed time', 'On exit intent', 'On scroll'],
  position: 'Position',
  positionOptions: ['Bottom right corner', 'Center'],
  width: 'Width',
  overlay: 'Dark overlay',
  emoji: 'Emoji',
  animation: 'Emoji animation',
  animations: ['Wave', 'Tada', 'Heart beat', 'Spin', 'Flash', 'Bounce', 'Rubber band', 'Head shake'],
  hideOnSubmit: 'Hide on submit',
  track: 'Track form events',
  customDomain: 'Custom domain',
  branding: 'Tally branding',
  preview: 'Preview',
  codeTitle: 'Embed code',
  codeHelp: 'Paste this HTML code snippet on the page where you want the embed to appear.',
  copyCode: 'Copy code',
  codeCopied: 'Embed code copied.',
  closePopup: 'Close popup',
  openPopup: 'Open popup',
  yourName: 'Your name',
  submit: 'Submit',
  thanks: 'Thanks for completing this form!',
  thanksSub: 'This is only a preview. Nothing was sent.',
  madeWith: 'Made with Tally',
}

/** Republishing: the full sheet only when it helps. */
export const publishCopy = {
  updated: 'Your form is updated.',
  share: 'Share',
  protoLabel: 'Publish state',
  protoFirst: 'First publish',
  protoNoResponses: 'Republish, no responses',
  protoResponses: 'Republish, has responses',
}

/** Free or Pro, as played by the prototype bar. */
export const planCopy = {
  protoLabel: 'Plan',
  free: 'Free',
  pro: 'Pro',
  upgradeToSave: 'Upgrade to Save',
  /** Free, with a logo in the code: downloading it is Pro. */
  upgradeToDownload: 'Upgrade to download',
  domainSaved: 'Custom domain saved.',
  previewSaved: 'Link preview updated.',
  logoSaved: 'Logo saved for your codes.',
}

/**
 * Social tab. Final wording from the copy review.
 * Functions take the form title so this file never depends on the store.
 */
export const shareCopy = {
  /** Under the link, like Tally today. Once a domain is saved it reads Edit custom domain. */
  useDomain: 'Use custom domain',
  editDomain: 'Edit custom domain',
  tagLine: 'We tag each link so you can see where responses come from.',
  copiedInline: 'Copied',
  copyLink: 'Copy link',
  open: 'Open',
  copyFor: (place: string) => `Copy link for ${place}`,
  openFor: (place: string) => `Share link on ${place}`,
}
