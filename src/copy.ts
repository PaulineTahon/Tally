/** UI strings, kept together for copy review. */

export const rowCopy = {
  download: (place: string, format: string) => `Download ${place} as ${format.toUpperCase()}`,
  copyLink: 'Copy link',
  openLink: 'Open link',
  rename: 'Rename',
  delete: 'Delete',
  renamed: (place: string) => (place.length > 24 ? 'Code renamed' : `Renamed to ${place}`),
  deleted: (place: string) => `${place} code deleted`,
  deleteTitle: (place: string) => `Delete the ${place} code?`,
  /** No line at all when the code has no responses yet. */
  deleteKept: (n: number) => (n === 0 ? null : n === 1 ? 'Its 1 response stays in Insights.' : `Its ${n} responses stay in Insights.`),
  deleteUntag: (place: string) => `Printed copies still open your form, but new responses won't be tagged ${place}.`,
  deleteConfirm: 'Delete',
  cancel: 'Cancel',
}

/** Link ending: old endings keep redirecting, and stay reserved for this form. */
export const endingCopy = {
  label: 'Link Ending',
  help: 'Make it yours, like tally.so/r/summer-rsvp.',
  changeNote: 'Old links and printed codes keep working.',
  change: 'Change link',
  save: 'Save',
  cancel: 'Cancel',
  updated: 'Link updated.',
  alsoWorks: 'Also works',
  alsoWorksHelp: 'Reserved for this form. They open it too.',
  formId: 'Form ID, always works',
  remove: 'Remove',
  removeConfirm: (ending: string) => `Remove ${ending}? Links and codes that use it will stop working.`,
  removed: (ending: string) => `${ending} removed`,
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
  upgradeToast: 'Saving this is part of Pro.',
  seePlans: 'See plans',
  domainSaved: 'Custom domain saved.',
  previewSaved: 'Link preview updated.',
  styleSaved: 'Style saved for your codes.',
}

/**
 * Social and Email panels. Placeholder wording for now; the final strings drop in here.
 * Functions take the form title so this file never depends on the store.
 */
export const shareCopy = {
  socialIntro: 'Post it where your people are.',
  messageLabel: 'Message',
  defaultMessage: (title: string) => `Quick one: ${title}. It takes a minute.`,
  send: 'Send',
  copyMessageAndLink: 'Copy message and link',
  copyLinkOnly: 'Copy link only',
  messageCopied: 'Message and link copied.',
  linkCopied: 'Link copied. Go spread the word.',
  moreFor: (place: string) => `More for ${place}`,
  socialHint: 'Responses from copied messages show up under Copied message in Insights.',
  emailIntro: 'Drop it in your newsletter or inbox.',
  subjectLabel: 'Subject',
  bodyLabel: 'Message',
  defaultSubject: (title: string) => `Quick one: ${title}`,
  defaultBody: (title: string) => `Hi!\n\nCould you fill in ${title}? It takes a minute.`,
  linkNote: 'Your link goes at the end.',
  openMail: 'Open in mail app',
  copyEmail: 'Copy message with link',
  emailCopied: 'Message and link copied.',
  emailHint: "The link is tagged, so you'll see responses from email.",
}
