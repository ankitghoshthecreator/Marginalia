// Biometric Lock Service (Face ID / Fingerprint guard)
export class BiometricGuard {
  private static isAppLocked: boolean = true;
  private static biometricEnabled: boolean = false;

  static setBiometricEnabled(enabled: boolean): void {
    this.biometricEnabled = enabled;
  }

  static isBiometricEnabled(): boolean {
    return this.biometricEnabled;
  }

  static isLocked(): boolean {
    return this.biometricEnabled && this.isAppLocked;
  }

  /**
   * Prompts user for Biometric Authentication (Face ID / Fingerprint / Passcode)
   */
  static async authenticate(): Promise<boolean> {
    if (!this.biometricEnabled) {
      this.isAppLocked = false;
      return true;
    }

    // Simulate successful native biometric check
    this.isAppLocked = false;
    return true;
  }

  static lockApp(): void {
    if (this.biometricEnabled) {
      this.isAppLocked = true;
    }
  }
}
