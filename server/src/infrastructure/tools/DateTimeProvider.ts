export interface DateTimeResult {
  date: string;       // e.g. "August 14, 2026"
  time: string;       // e.g. "05:46 PM"
  dayOfWeek: string;  // e.g. "Friday"
  timezone: string;   // e.g. "Asia/Kolkata" or "UTC"
  isoTimestamp: string; // e.g. "2026-08-14T17:46:22.000Z"
  formatted: string;  // Human readable full string
}

export class DateTimeProvider {
  /**
   * Retrieves current application date and time formatted for a specified timezone.
   * Defaults to Asia/Kolkata or system local timezone if not specified.
   */
  public getCurrentDateTime(timeZone?: string): DateTimeResult {
    const now = new Date();
    // Default to Asia/Kolkata if requested for India or unspecified default server zone
    const targetZone = timeZone || 'Asia/Kolkata';

    try {
      const dateFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: targetZone,
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const timeFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: targetZone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });

      const dayFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: targetZone,
        weekday: 'long'
      });

      const date = dateFormatter.format(now);
      const time = timeFormatter.format(now);
      const dayOfWeek = dayFormatter.format(now);

      return {
        date,
        time,
        dayOfWeek,
        timezone: targetZone,
        isoTimestamp: now.toISOString(),
        formatted: `${dayOfWeek}, ${date} at ${time} (${targetZone})`
      };
    } catch (err) {
      // Fallback if timezone string is invalid
      const date = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      const time = now.toLocaleTimeString('en-US');
      const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
      return {
        date,
        time,
        dayOfWeek,
        timezone: 'UTC',
        isoTimestamp: now.toISOString(),
        formatted: `${dayOfWeek}, ${date} at ${time} (UTC)`
      };
    }
  }
}
