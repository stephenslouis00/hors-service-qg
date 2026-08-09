const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3'

const HS_CALENDAR_NAME = 'HS'
const HS_CALENDAR_COLOR_ID = '6' // Tangerine — Google Calendar's built-in palette

export interface CalendarEventInput {
  title: string
  description?: string
  startAt: number
  endAt: number
  allDay?: boolean
}

function toGoogleDateField(epochMs: number, allDay?: boolean) {
  if (allDay) return { date: new Date(epochMs).toISOString().slice(0, 10) }
  return { dateTime: new Date(epochMs).toISOString() }
}

async function callCalendarApi(url: string, accessToken: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  if (!response.ok) {
    const error = new Error(`Google Calendar API error (${response.status})`)
    ;(error as Error & { status?: number }).status = response.status
    throw error
  }
  if (response.status === 204) return null
  return response.json()
}

// Cached per browser tab session — avoids re-resolving the calendar on every sync click.
let cachedHsCalendarId: string | null = null

/**
 * Finds the user's "HS" Google Calendar, creating it (with a dedicated color)
 * the first time. All synced events go here instead of the user's primary
 * calendar, so band stuff doesn't mix into their personal agenda.
 */
export async function getOrCreateHsCalendar(accessToken: string): Promise<string> {
  if (cachedHsCalendarId) return cachedHsCalendarId

  const list = await callCalendarApi(`${CALENDAR_API_BASE}/users/me/calendarList?minAccessRole=owner`, accessToken)
  const existing = (list.items as { id: string; summary: string }[] | undefined)?.find((c) => c.summary === HS_CALENDAR_NAME)
  if (existing) {
    cachedHsCalendarId = existing.id
    return existing.id
  }

  const created = await callCalendarApi(`${CALENDAR_API_BASE}/calendars`, accessToken, {
    method: 'POST',
    body: JSON.stringify({ summary: HS_CALENDAR_NAME }),
  })
  const calendarId = created.id as string

  try {
    await callCalendarApi(`${CALENDAR_API_BASE}/users/me/calendarList/${encodeURIComponent(calendarId)}`, accessToken, {
      method: 'PATCH',
      body: JSON.stringify({ colorId: HS_CALENDAR_COLOR_ID }),
    })
  } catch {
    // Non-critical: the calendar still works without its custom color.
  }

  cachedHsCalendarId = calendarId
  return calendarId
}

export async function createGoogleCalendarEvent(accessToken: string, calendarId: string, event: CalendarEventInput): Promise<string> {
  const body = {
    summary: event.title,
    description: event.description,
    start: toGoogleDateField(event.startAt, event.allDay),
    end: toGoogleDateField(event.endAt, event.allDay),
  }
  const result = await callCalendarApi(`${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`, accessToken, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return result.id as string
}

export async function updateGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  googleEventId: string,
  event: CalendarEventInput,
): Promise<void> {
  const body = {
    summary: event.title,
    description: event.description,
    start: toGoogleDateField(event.startAt, event.allDay),
    end: toGoogleDateField(event.endAt, event.allDay),
  }
  await callCalendarApi(`${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${googleEventId}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export async function deleteGoogleCalendarEvent(accessToken: string, calendarId: string, googleEventId: string): Promise<void> {
  try {
    await callCalendarApi(`${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${googleEventId}`, accessToken, {
      method: 'DELETE',
    })
  } catch (err) {
    const status = (err as Error & { status?: number }).status
    // Already gone from Google's side — nothing left to do.
    if (status === 404 || status === 410) return
    throw err
  }
}

/** Emails (other than the given one) who'd synced this item to their own Google Calendar. */
export function otherSyncedEmails(
  googleEventId: Record<string, string> | undefined,
  currentEmail: string | null | undefined,
): string[] {
  if (!googleEventId) return []
  return Object.keys(googleEventId).filter((email) => email !== currentEmail)
}
