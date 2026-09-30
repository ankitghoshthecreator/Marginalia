import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Palette } from '../src/ui/palette';
import { Typography } from '../src/ui/typography';
import { consentManager, PairingSession } from '../src/mcp/consent';
import { mcpServer } from '../src/mcp/server';

export default function MCPScreen() {
  const [session, setSession] = useState<PairingSession | null>(null);
  const [status, setStatus] = useState<string>('Not connected');

  const handleGeneratePairing = () => {
    const s = consentManager.generatePairingSession();
    setSession(s);
    setStatus('Pairing code generated');
  };

  const handleApprove = async () => {
    if (!session) return;
    consentManager.approvePairing(session.pairingCode);
    consentManager.grantToolPermission('get_recent_entries');
    consentManager.grantToolPermission('get_habit_streaks');
    consentManager.grantToolPermission('get_weekly_digest');

    const msg = await mcpServer.start();
    setStatus(`Approved! ${msg}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Desktop AI Pairing (MCP)</Text>
      <Text style={styles.subtext}>
        Connect Claude Desktop or an MCP client over local loopback (127.0.0.1) with per-tool consent approval.
      </Text>

      <TouchableOpacity style={styles.button} onPress={handleGeneratePairing}>
        <Text style={styles.buttonText}>Generate QR Pairing Code</Text>
      </TouchableOpacity>

      {session ? (
        <View style={styles.codeBox}>
          <Text style={styles.codeTitle}>Pairing Code:</Text>
          <Text style={styles.code}>{session.pairingCode}</Text>
          <TouchableOpacity style={[styles.button, styles.approveBtn]} onPress={handleApprove}>
            <Text style={styles.buttonText}>Approve Desktop Connection</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <Text style={styles.status}>Status: {status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.background, padding: 20 },
  header: {
    fontSize: Typography.sizes.xl,
    fontFamily: Typography.fontFamilySerif,
    fontWeight: Typography.weights.bold,
    color: Palette.text,
    marginBottom: 8,
  },
  subtext: { fontSize: Typography.sizes.sm, color: Palette.subtext, marginBottom: 20 },
  button: {
    backgroundColor: Palette.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  approveBtn: { backgroundColor: Palette.text, marginTop: 12 },
  buttonText: { color: Palette.white, fontWeight: Typography.weights.semibold },
  codeBox: {
    backgroundColor: Palette.surface,
    borderColor: Palette.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  codeTitle: { fontSize: Typography.sizes.xs, color: Palette.subtext },
  code: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold, color: Palette.text, marginVertical: 8 },
  status: { marginTop: 20, textAlign: 'center', color: Palette.subtext, fontSize: Typography.sizes.sm },
});
