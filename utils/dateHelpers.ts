/**
 * Get today's date as YYYY-MM-DD string
 */
export function getTodayKey(): string {
  return formatDateKey(new Date());
}

/**
 * Format a Date to YYYY-MM-DD string
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate 'Day X of Training' from install date
 */
export function getDayOfTraining(installDate: string): number {
  const install = new Date(installDate);
  const now = new Date();
  const diffTime = now.getTime() - install.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // Day 1 is the install day
}

/**
 * Format date for display: 'Mar 24, 2026'
 */
export function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format time for display: '2:30 PM'
 */
export function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Get dates for the last N days (newest first)
 */
export function getLastNDays(n: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(formatDateKey(date));
  }
  return dates;
}

/**
 * Parse a YYYY-MM-DD key into a Date
 */
export function parseDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}
