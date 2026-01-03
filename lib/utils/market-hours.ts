/**
 * Market hours utility for US stock market
 * Market hours: 9:30 AM - 4:00 PM ET, Monday-Friday
 */

/**
 * Check if US market is currently open
 * @returns true if market is open, false otherwise
 */
export function isMarketOpen(): boolean {
  const now = new Date();
  const etTime = getETTime(now);
  const dayOfWeek = etTime.getDay(); // 0 = Sunday, 6 = Saturday

  // Market is closed on weekends
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false;
  }

  const hours = etTime.getHours();
  const minutes = etTime.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  // Market hours: 9:30 AM (9:30) to 4:00 PM (16:00) ET
  const marketOpenMinutes = 9 * 60 + 30; // 9:30 AM
  const marketCloseMinutes = 16 * 60; // 4:00 PM

  return totalMinutes >= marketOpenMinutes && totalMinutes < marketCloseMinutes;
}

/**
 * Get the next market open time
 * @returns Date object representing the next market open time (9:30 AM ET)
 */
export function getNextMarketOpenTime(): Date {
  const now = new Date();
  const etTime = getETTime(now);
  const dayOfWeek = etTime.getDay();
  const hours = etTime.getHours();
  const minutes = etTime.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  const marketOpenMinutes = 9 * 60 + 30; // 9:30 AM

  let daysToAdd = 0;

  if (dayOfWeek === 0) {
    // Sunday - next open is Monday
    daysToAdd = 1;
  } else if (dayOfWeek === 6) {
    // Saturday - next open is Monday
    daysToAdd = 2;
  } else if (totalMinutes >= marketOpenMinutes) {
    // After market open today - next open is tomorrow
    daysToAdd = 1;
    // If tomorrow is Saturday, add 2 more days
    if (dayOfWeek === 5) {
      // Friday - next open is Monday
      daysToAdd = 3;
    }
  }
  // If before market open today and it's a weekday, next open is today

  const nextOpen = new Date(etTime);
  nextOpen.setDate(nextOpen.getDate() + daysToAdd);
  nextOpen.setHours(9, 30, 0, 0); // 9:30 AM ET

  // Convert back to UTC for return
  return convertETToUTC(nextOpen);
}

/**
 * Get seconds until next market open
 * @returns Number of seconds until market opens
 */
export function getSecondsUntilMarketOpen(): number {
  const now = new Date();
  const nextOpen = getNextMarketOpenTime();
  const diffMs = nextOpen.getTime() - now.getTime();
  return Math.max(0, Math.floor(diffMs / 1000));
}

/**
 * Get ET time from UTC date
 */
function getETTime(utcDate: Date): Date {
  // ET is UTC-5 (EST) or UTC-4 (EDT)
  // For simplicity, we'll use a fixed offset approach
  // In production, you might want to use a timezone library like date-fns-tz

  // Create a date in ET timezone
  // ET is UTC-5 in winter, UTC-4 in summer (EDT)
  // We'll approximate by checking if DST is likely active
  const utcHours = utcDate.getUTCHours();
  const month = utcDate.getUTCMonth(); // 0-11

  // DST in US typically runs from March to November
  // Simple approximation: March (2) to October (9) = EDT (UTC-4), otherwise EST (UTC-5)
  const isDST = month >= 2 && month <= 9;
  const etOffset = isDST ? -4 : -5;

  const etDate = new Date(utcDate);
  etDate.setUTCHours(utcDate.getUTCHours() + etOffset);
  return etDate;
}

/**
 * Convert ET time to UTC date
 */
function convertETToUTC(etDate: Date): Date {
  const month = etDate.getUTCMonth();
  const isDST = month >= 2 && month <= 9;
  const etOffset = isDST ? -4 : -5;

  const utcDate = new Date(etDate);
  utcDate.setUTCHours(etDate.getUTCHours() - etOffset);
  return utcDate;
}
