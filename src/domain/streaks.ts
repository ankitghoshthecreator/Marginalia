export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  lastLoggedDate: string | null;
}

/**
 * Pure domain engine to compute habit streaks strictly from logged dates.
 * Does NOT use simple checkboxes; parses entry log dates (YYYY-MM-DD).
 */
export class StreakEngine {
  /**
   * Calculates current and longest streak from an array of logged dates (YYYY-MM-DD)
   */
  static calculateStreak(loggedDates: string[]): StreakResult {
    if (!loggedDates || loggedDates.length === 0) {
      return { currentStreak: 0, longestStreak: 0, totalCompletions: 0, lastLoggedDate: null };
    }

    // Sort unique dates ascending
    const uniqueSorted = Array.from(new Set(loggedDates)).sort();
    const totalCompletions = uniqueSorted.length;
    const lastLoggedDate = uniqueSorted[uniqueSorted.length - 1];

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);

    // Calculate longest streak
    for (let i = 0; i < uniqueSorted.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prev = new Date(uniqueSorted[i - 1]);
        const curr = new Date(uniqueSorted[i]);
        const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 3600 * 24));

        if (diffDays === 1) {
          tempStreak += 1;
        } else {
          tempStreak = 1;
        }
      }
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    }

    // Calculate current streak active status
    const hasToday = uniqueSorted.includes(todayStr);
    const hasYesterday = uniqueSorted.includes(yesterdayStr);

    if (hasToday || hasYesterday) {
      currentStreak = tempStreak;
    } else {
      currentStreak = 0;
    }

    return {
      currentStreak,
      longestStreak,
      totalCompletions,
      lastLoggedDate,
    };
  }
}
