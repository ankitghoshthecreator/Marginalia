import crypto from 'crypto';

export interface PairingSession {
  pairingCode: string;
  qrPayload: string;
  isApproved: boolean;
  allowedTools: Set<string>;
  createdAt: number;
}

/**
 * Manages QR pairing codes and per-tool explicit user consent for desktop AI assistants.
 */
export class ConsentManager {
  private activeSession: PairingSession | null = null;

  generatePairingSession(): PairingSession {
    const pairingCode = Math.floor(100000 + Math.random() * 900000).toString();
    const qrPayload = JSON.stringify({
      server: '127.0.0.1',
      port: 8080,
      code: pairingCode,
    });

    this.activeSession = {
      pairingCode,
      qrPayload,
      isApproved: false,
      allowedTools: new Set(),
      createdAt: Date.now(),
    };

    return this.activeSession;
  }

  approvePairing(pairingCode: string): boolean {
    if (this.activeSession && this.activeSession.pairingCode === pairingCode) {
      this.activeSession.isApproved = true;
      return true;
    }
    return false;
  }

  grantToolPermission(toolName: string): void {
    if (this.activeSession) {
      this.activeSession.allowedTools.add(toolName);
    }
  }

  isToolAllowed(toolName: string): boolean {
    if (!this.activeSession || !this.activeSession.isApproved) {
      return false;
    }
    return this.activeSession.allowedTools.has(toolName);
  }
}

export const consentManager = new ConsentManager();
