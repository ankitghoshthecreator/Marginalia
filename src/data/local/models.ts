export interface ProfileModel {
  id: string;
  displayName?: string;
  createdAt: number;
}

export interface EntryModel {
  id: string;
  userId: string;
  bodyCiphertext: string;
  bodyNonce: string;
  moodLabel?: string;
  moodConfidence?: number;
  createdAt: number;
  updatedAt: number;
  deviceVectorClock: Record<string, number>;
}

export interface HabitModel {
  id: string;
  userId: string;
  name: string;
  cadence: 'daily' | 'weekly' | 'custom';
  createdAt: number;
}

export interface HabitLogModel {
  id: string;
  habitId: string;
  loggedAt: string; // YYYY-MM-DD
}
