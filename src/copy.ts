/** UI strings, kept together for copy review. */

/** Title of the demo form every printed code opens. One place, so a new title is a one-line change. */
export const EGG_TITLE = 'Scanned your way here'

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
  logoSaved: 'Logo saved for your codes.',
}

/**
 * Social and Email panels. Final wording from the copy review.
 * Functions take the form title so this file never depends on the store.
 */
export const shareCopy = {
  messageLabel: 'Message',
  edit: 'Edit',
  editMessage: 'Edit message',
  messageDone: 'Done',
  messageHint: 'Used for every channel below. The link is added for you.',
  messageEmpty: 'Just the link',
  copiedInline: 'Copied',
  copyFor: (place: string) => `Copy link for ${place}`,
  copyMessageAria: 'Copy message with the link',
  defaultMessage: (title: string) => `I'd love your answers to ${title}.`,
  send: 'Send',
  copyMessageAndLink: 'Copy message',
  messageCopied: 'Message copied',
  linkCopied: 'Link copied',
  emailIntro: 'Edit the message below, then send it from your mail app or paste it anywhere.',
  subjectLabel: 'Subject',
  bodyLabel: 'Message',
  defaultSubject: (title: string) => `Got a minute? ${title}`,
  defaultBody: (title: string) => `Hi,\n\nI'd love your answers to ${title}. Here's the link:`,
  linkNote: 'The link is added at the end:',
  openMail: 'Open in mail app',
  copyEmail: 'Copy message',
  emailCopied: 'Message copied',
  emailHint: 'The link is tagged, so responses from email show up under Email in Insights.',
}
