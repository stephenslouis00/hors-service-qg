export function gmailComposeUrl(email: string, subject?: string): string {
  const params = new URLSearchParams({ view: 'cm', fs: '1', to: email })
  if (subject) params.set('su', subject)
  return `https://mail.google.com/mail/?${params.toString()}`
}

export function openGmailCompose(email: string, subject?: string) {
  window.open(gmailComposeUrl(email, subject), '_blank', 'noopener,noreferrer')
}
