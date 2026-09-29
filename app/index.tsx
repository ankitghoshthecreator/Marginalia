import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Palette } from '../src/ui/palette';
import { Typography } from '../src/ui/typography';

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Marginalia</Text>
      <Text style={styles.subtitle}>Private, offline-first journal & habit tracker</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    color: Palette.text,
    fontFamily: Typography.fontFamilySerif,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: Typography.sizes.md,
    color: Palette.subtext,
    fontFamily: Typography.fontFamilySans,
    textAlign: 'center',
  },
});
