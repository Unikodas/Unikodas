import type { SmsProvider } from './provider';

/**
 * Dev-only SMS provider. Prints the OTP code to the server console
 * instead of sending an SMS. Refuses to operate unless OTP_DEV_MODE=true,
 * so an accidental production deploy fails loud.
 */
export const stubSmsProvider: SmsProvider = {
  async sendOtp(phoneE164, code) {
    if (process.env.OTP_DEV_MODE !== 'true') {
      throw new Error(
        'Stub SMS provider invoked without OTP_DEV_MODE=true. ' +
          'Configure a real SMS provider before going to production.',
      );
    }
    // Visible separator so the code is easy to spot in dev logs.
    console.log('\n──────────────────────────────────────────────');
    console.log(`[OTP DEV]  phone=${phoneE164}  code=${code}`);
    console.log('──────────────────────────────────────────────\n');
  },
};
