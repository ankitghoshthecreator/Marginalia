import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Palette } from '../src/ui/palette';
import { Typography } from '../src/ui/typography';
import { EncryptionEngine } from '../src/data/local/encryption';
import { localDatabase } from '../src/data/local/database';
import { SentimentPipeline } from '../src/ml/pipeline';

export default function JournalEditorScreen() {
  const [entryText, setEntryText] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [detectedMood, setDetectedMood] = useState<string | null>(null);

  const handleSave = async () => {
    if (!entryText.trim()) return;

    setStatusMsg('Encrypting entry on-device...');
    // 1. Client-Side Encryption
    const encrypted = await EncryptionEngine.encrypt(entryText);

    // 2. Local TFLite Classification
    const sentiment = await SentimentPipeline.analyzeEntry(entryText);
    setDetectedMood(`${sentiment.label} (${(sentiment.confidence * 100).toFixed(0)}%)`);

    // 3. Save to WatermelonDB
    await localDatabase.createEntry({
      userId: 'usr_local',
      bodyCiphertext: encrypted.bodyCiphertext,
      bodyNonce: encrypted.bodyNonce,
      moodLabel: sentiment.label,
      moodConfidence: sentiment.confidence,
      deviceVectorClock: { localDevice: Date.now() },
    });

    setStatusMsg('Saved locally & encrypted successfully!');
    setEntryText('');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Daily Log</Text>
      <TextInput
        style={styles.input}
        multiline
        placeholder="Write your reflection for today..."
        placeholderTextColor={Palette.subtext}
        value={entryText}
        onChangeText={setEntryText}
      />
      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save Entry (Encrypted)</Text>
      </TouchableOpacity>

      {statusMsg ? <Text style={styles.status}>{statusMsg}</Text> : null}
      {detectedMood ? (
        <View style={styles.moodCard}>
          <Text style={styles.moodLabel}>On-Device Sentiment:</Text>
          <Text style={styles.moodValue}>{detectedMood}</Text>
        </View>
      ) : null}
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
  input: {
    backgroundColor: Palette.surface,
    borderColor: Palette.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    minHeight: 180,
    fontSize: Typography.sizes.md,
    color: Palette.text,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  button: {
    backgroundColor: Palette.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: Palette.white,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  status: {
    marginTop: 14,
    color: Palette.subtext,
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
  },
  moodCard: {
    marginTop: 16,
    padding: 14,
    backgroundColor: Palette.surface,
    borderRadius: 8,
    borderColor: Palette.border,
    borderWidth: 1,
  },
  moodLabel: { fontSize: Typography.sizes.xs, color: Palette.subtext },
  moodValue: { fontSize: Typography.sizes.md, color: Palette.text, fontWeight: Typography.weights.bold, marginTop: 2 },
});
