/** UI strings for the code rows and the link ending, kept together for copy review. */

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
