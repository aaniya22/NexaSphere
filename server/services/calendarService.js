function escapeIcsText(text) {
  if (!text) return '';
  return String(text)
    .replace(/[\\;,]/g, (c) => `\\${c}`)
    .replace(/\n/g, '\\n');
}

export const calendarService = {
  generateIcsEvent({ name, dateText, description, location, eventId }) {
    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const uid = `${eventId}@nexasphere`;
    let dtStart;
    if (dateText) {
      const parsed = new Date(dateText);
      if (!isNaN(parsed.getTime())) {
        dtStart = parsed.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      }
    }
    if (!dtStart) {
      dtStart = now;
    }
    const dtEnd =
      new Date(new Date(dtStart).getTime() + 2 * 60 * 60 * 1000)
        .toISOString()
        .replace(/[-:]/g, '')
        .split('.')[0] + 'Z';

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//NexaSphere//Events//EN',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${escapeIcsText(name)}`,
      `DESCRIPTION:${escapeIcsText(description || '')}`,
      `LOCATION:${escapeIcsText(location || '')}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
  },
};
