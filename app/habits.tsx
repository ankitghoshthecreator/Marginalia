import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Palette } from '../src/ui/palette';
import { Typography } from '../src/ui/typography';
import { localDatabase } from '../src/data/local/database';
import { StreakEngine, StreakResult } from '../src/domain/streaks';

export default function HabitsScreen() {
  const [habitList, setHabitList] = useState<{ id: string; name: string; streak: StreakResult }[]>([]);

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    const habits = await localDatabase.getAllHabits();
    const loaded = await Promise.all(
      habits.map(async (h) => {
        const logs = await localDatabase.getHabitLogs(h.id);
        const dates = logs.map((l) => l.loggedAt);
        const streak = StreakEngine.calculateStreak(dates);
        return { id: h.id, name: h.name, streak };
      })
    );
    setHabitList(loaded);
  };

  const handleAddHabit = async () => {
    const created = await localDatabase.createHabit({
      userId: 'usr_local',
      name: 'Morning Meditation',
      cadence: 'daily',
    });
    const today = new Date().toISOString().slice(0, 10);
    await localDatabase.logHabit(created.id, today);
    loadHabits();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Habit Streaks</Text>

      <TouchableOpacity style={styles.addButton} onPress={handleAddHabit}>
        <Text style={styles.addButtonText}>+ Add Sample Habit</Text>
      </TouchableOpacity>

      {habitList.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.habitName}>{item.name}</Text>
          <View style={styles.streakRow}>
            <Text style={styles.streakText}>🔥 {item.streak.currentStreak} day streak</Text>
            <Text style={styles.longestText}>Best: {item.streak.longestStreak} days</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.background },
  content: { padding: 20 },
  header: {
    fontSize: Typography.sizes.xl,
    fontFamily: Typography.fontFamilySerif,
    fontWeight: Typography.weights.bold,
    color: Palette.text,
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: Palette.surface,
    borderColor: Palette.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  addButtonText: { color: Palette.primary, fontWeight: Typography.weights.medium },
  card: {
    backgroundColor: Palette.surface,
    borderRadius: 8,
    padding: 16,
    borderColor: Palette.border,
    borderWidth: 1,
    marginBottom: 12,
  },
  habitName: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Palette.text },
  streakRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  streakText: { color: Palette.primary, fontWeight: Typography.weights.semibold },
  longestText: { color: Palette.subtext, fontSize: Typography.sizes.xs },
});
