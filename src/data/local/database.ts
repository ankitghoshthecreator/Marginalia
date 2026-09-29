import { EntryModel, HabitModel, HabitLogModel } from './models';

// In-memory reactive local store simulation for WatermelonDB layer abstraction
class LocalDatabase {
  private entries: Map<string, EntryModel> = new Map();
  private habits: Map<string, HabitModel> = new Map();
  private habitLogs: Map<string, HabitLogModel> = new Map();

  // Entry CRUD
  async createEntry(entry: Omit<EntryModel, 'id' | 'createdAt' | 'updatedAt'>): Promise<EntryModel> {
    const id = `entry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();
    const newEntry: EntryModel = {
      ...entry,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.entries.set(id, newEntry);
    return newEntry;
  }

  async getEntryById(id: string): Promise<EntryModel | null> {
    return this.entries.get(id) || null;
  }

  async getAllEntries(): Promise<EntryModel[]> {
    return Array.from(this.entries.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  async updateEntryMood(id: string, moodLabel: string, moodConfidence: number): Promise<EntryModel | null> {
    const entry = this.entries.get(id);
    if (!entry) return null;
    const updated: EntryModel = {
      ...entry,
      moodLabel,
      moodConfidence,
      updatedAt: Date.now(),
    };
    this.entries.set(id, updated);
    return updated;
  }

  // Habit CRUD
  async createHabit(habit: Omit<HabitModel, 'id' | 'createdAt'>): Promise<HabitModel> {
    const id = `habit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newHabit: HabitModel = {
      ...habit,
      id,
      createdAt: Date.now(),
    };
    this.habits.set(id, newHabit);
    return newHabit;
  }

  async getAllHabits(): Promise<HabitModel[]> {
    return Array.from(this.habits.values());
  }

  async logHabit(habitId: string, loggedAt: string): Promise<HabitLogModel> {
    const id = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newLog: HabitLogModel = { id, habitId, loggedAt };
    this.habitLogs.set(id, newLog);
    return newLog;
  }

  async getHabitLogs(habitId: string): Promise<HabitLogModel[]> {
    return Array.from(this.habitLogs.values()).filter((log) => log.habitId === habitId);
  }
}

export const localDatabase = new LocalDatabase();
