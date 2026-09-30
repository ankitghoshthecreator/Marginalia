import { MoodBucket } from '../ml/classifier';

export interface MoodSummary {
  dominantMood: MoodBucket;
  distribution: Record<MoodBucket, number>;
  totalEntriesAnalyzed: number;
  periodStartDate: string;
  periodEndDate: string;
}

export interface WeeklyDigest {
  summaryText: string;
  moodSummary: MoodSummary;
  habitCompletionRate: number;
}

/**
 * Pure domain logic for generating local weekly summaries without any external API calls.
 */
export class DigestEngine {
  static generateWeeklyDigest(
    moodHistory: { mood: MoodBucket; createdAt: number }[],
    totalHabitLogs: number,
    expectedHabitLogs: number
  ): WeeklyDigest {
    const defaultDistribution: Record<MoodBucket, number> = {
      low: 0,
      flat: 0,
      neutral: 0,
      lifted: 0,
      'high-energy': 0,
    };

    if (!moodHistory || moodHistory.length === 0) {
      return {
        summaryText: 'No entries recorded in the last 7 days.',
        moodSummary: {
          dominantMood: 'neutral',
          distribution: defaultDistribution,
          totalEntriesAnalyzed: 0,
          periodStartDate: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
          periodEndDate: new Date().toISOString().slice(0, 10),
        },
        habitCompletionRate: 0,
      };
    }

    const distribution = { ...defaultDistribution };
    for (const item of moodHistory) {
      distribution[item.mood] = (distribution[item.mood] || 0) + 1;
    }

    let dominantMood: MoodBucket = 'neutral';
    let maxCount = -1;
    (Object.keys(distribution) as MoodBucket[]).forEach((key) => {
      if (distribution[key] > maxCount) {
        maxCount = distribution[key];
        dominantMood = key;
      }
    });

    const completionRate = expectedHabitLogs > 0 ? Math.min(100, Math.round((totalHabitLogs / expectedHabitLogs) * 100)) : 0;
    const summaryText = `Over the past week, your dominant mood was '${dominantMood}' based on ${moodHistory.length} entry classifications. Habit completion rate was ${completionRate}%.`;

    return {
      summaryText,
      moodSummary: {
        dominantMood,
        distribution,
        totalEntriesAnalyzed: moodHistory.length,
        periodStartDate: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
        periodEndDate: new Date().toISOString().slice(0, 10),
      },
      habitCompletionRate: completionRate,
    };
  }
}
