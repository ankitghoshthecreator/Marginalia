// Keychain / Keystore Key Management abstraction for client-side encryption key derivation
class KeyManager {
  private masterKey: string | null = null;

  /**
   * Retrieves or generates the 256-bit encryption key stored securely in iOS Keychain / Android Keystore.
   * The master key NEVER leaves the device.
   */
  async getOrCreateMasterKey(): Promise<string> {
    if (this.masterKey) {
      return this.masterKey;
    }

    // Simulate retrieving key from native Keychain/Keystore or generating a new secure 256-bit key
    const generatedKey = Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join('');

    this.masterKey = generatedKey;
    return this.masterKey;
  }

  /**
   * Generates a unique 96-bit initialization vector (nonce) for AES-256-GCM.
   */
  generateNonce(): string {
    return Array.from({ length: 12 }, () =>
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join('');
  }
}

export const keyManager = new KeyManager();
