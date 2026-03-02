/** Today's date in local timezone (YYYY-MM-DD). Use for diet logs so entries match the user's local day. */
export function getTodayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Local date (YYYY-MM-DD) of an ISO timestamp. Use to filter entries by when they were actually logged. */
export function getLocalDateFromIso(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
