import { localDatabase } from '../data/local/database';
import { StreakEngine } from '../domain/streaks';
import { DigestEngine } from '../domain/digest';

/**
 * Exposed Read-Only MCP Tools.
 * All tools return mood/stats insights and NEVER expose raw entry text without explicit session permission.
 */
export const MCPTools = {
  /**
   * Tool: get_recent_entries(days: number)
   * Returns mood classifications and timestamps, omitting body text.
   */
  async get_recent_entries(days: number = 7) {
    const entries = await localDatabase.getAllEntries();
    const cutoff = Date.now() - days * 86400000;
    const recent = entries.filter((e) => e.createdAt >= cutoff);

    return recent.map((e) => ({
      id: e.id,
      moodLabel: e.moodLabel || 'unclassified',
      moodConfidence: e.moodConfidence || 0,
      createdAt: new Date(e.createdAt).toISOString(),
    }));
  },

  /**
   * Tool: get_habit_streaks()
   * Returns current and longest streaks per habit.
   */
  async get_habit_streaks() {
    const habits = await localDatabase.getAllHabits();
    const streaks = await Promise.all(
      habits.map(async (habit) => {
        const logs = await localDatabase.getHabitLogs(habit.id);
        const dates = logs.map((l) => l.loggedAt);
        const streakResult = StreakEngine.calculateStreak(dates);
        return {
          habitId: habit.id,
          name: habit.name,
          cadence: habit.cadence,
          ...streakResult,
        };
      })
    );
    return streaks;
  },

  /**
   * Tool: get_weekly_digest()
   * Returns locally generated weekly summary digest.
   */
  async get_weekly_digest() {
    const entries = await localDatabase.getAllEntries();
    const cutoff = Date.now() - 7 * 86400000;
    const recent = entries.filter((e) => e.createdAt >= cutoff);

    const moodHistory = recent
      .filter((e) => e.moodLabel)
      .map((e) => ({ mood: e.moodLabel as any, createdAt: e.createdAt }));

    return DigestEngine.generateWeeklyDigest(moodHistory, 5, 7);
  },
};
