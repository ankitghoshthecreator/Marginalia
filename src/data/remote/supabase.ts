// Remote Supabase Client Wrapper & Auth Handler
export class SupabaseService {
  private static user: { id: string; email: string } | null = null;

  static async signInWithOTP(email: string): Promise<{ success: boolean; message: string }> {
    // Simulate Supabase auth email OTP request
    return {
      success: true,
      message: `OTP sent to ${email}`,
    };
  }

  static async verifyOTP(email: string, token: string): Promise<{ success: boolean; user?: { id: string; email: string } }> {
    // Simulate verifying OTP token
    if (token === '123456' || token.length === 6) {
      this.user = { id: 'usr_supabase_1001', email };
      return { success: true, user: this.user };
    }
    return { success: false };
  }

  static getCurrentUser() {
    return this.user;
  }
}
