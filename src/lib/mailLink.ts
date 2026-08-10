export function mailtoUrl(email: string, subject?: string): string {
  const params = new URLSearchParams()
  if (subject) params.set('subject', subject)
  const query = params.toString()
  return `mailto:${email}${query ? '?' + query : ''}`
}

/** Opens the user's own default mail app (Gmail, Mail.app, Outlook, whatever they've set), not a Gmail-specific page. */
export function openMailCompose(email: string, subject?: string) {
  window.location.href = mailtoUrl(email, subject)
}
