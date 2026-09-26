import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { IOtpService, SendOtpResult, VerifyOtpResult } from './otpService.interface.js';
import { DevelopmentOtpService } from './developmentOtpService.js';
import { AppError } from '../../utils/errors.js';

export class TwilioOtpService implements IOtpService {
  private fallbackService: DevelopmentOtpService;

  constructor() {
    this.fallbackService = new DevelopmentOtpService();
  }

  private isConfigured(): boolean {
    return (
      Boolean(process.env.TWILIO_ACCOUNT_SID) &&
      Boolean(process.env.TWILIO_AUTH_TOKEN) &&
      (Boolean(process.env.TWILIO_VERIFY_SERVICE_SID) || Boolean(process.env.TWILIO_PHONE_NUMBER))
    );
  }

  private formatPhone(p: string): string {
    const cleaned = p.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+')) return cleaned;
    if (cleaned.length === 10) return `+91${cleaned}`;
    return `+${cleaned}`;
  }

  async sendOtp(phoneNumber: string, purpose: string): Promise<SendOtpResult> {
    if (!this.isConfigured()) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          '[TWILIO OTP SERVICE] Credentials not set. Falling back to DevelopmentOtpService.'
        );
        return this.fallbackService.sendOtp(phoneNumber, purpose);
      }
      throw new AppError(
        'Twilio SMS provider credentials are not configured.',
        500,
        'Server Error'
      );
    }

    const result = await this.fallbackService.sendOtp(phoneNumber, purpose);

    if (process.env.NODE_ENV === 'test') {
      return result;
    }

    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID!;
      const authToken = process.env.TWILIO_AUTH_TOKEN!;
      const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
      const toFormatted = this.formatPhone(phoneNumber);
      const authHeader =
        'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');

      if (verifyServiceSid) {
        // Use Twilio Verify Service API (Trial compliant for India & International)
        const response = await fetch(
          `https://verify.twilio.com/v2/Services/${verifyServiceSid}/Verifications`,
          {
            method: 'POST',
            headers: {
              Authorization: authHeader,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              To: toFormatted,
              Channel: 'sms',
            }).toString(),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          console.error('[TWILIO VERIFY SERVICE] Failed to deliver SMS:', errorData);
        } else {
          console.log(`[TWILIO VERIFY SERVICE] Real SMS dispatched to ${toFormatted}`);
        }
      } else {
        // Standard Messages API
        const fromNumber = process.env.TWILIO_PHONE_NUMBER!;
        const fromFormatted = this.formatPhone(fromNumber);
        const params = new URLSearchParams({
          To: toFormatted,
          From: fromFormatted,
          Body: `Your CodeYoung verification code is: ${result.rawCode || '123456'}. Valid for 10 minutes.`,
        });

        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              Authorization: authHeader,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          console.error('[TWILIO OTP SERVICE] Failed to deliver SMS:', errorData);
        } else {
          console.log(`[TWILIO OTP SERVICE] Real SMS dispatched to ${toFormatted}`);
        }
      }
    } catch (err) {
      console.error('[TWILIO OTP SERVICE] Error sending SMS via Twilio API:', err);
    }

    return result;
  }

  async resendOtp(phoneNumber: string, purpose: string): Promise<SendOtpResult> {
    return this.sendOtp(phoneNumber, purpose);
  }

  async verifyOtp(phoneNumber: string, purpose: string, code: string): Promise<VerifyOtpResult> {
    const fallbackResult = await this.fallbackService.verifyOtp(phoneNumber, purpose, code);
    if (fallbackResult.success) {
      return fallbackResult;
    }

    const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
    if (verifyServiceSid && process.env.NODE_ENV !== 'test') {
      try {
        const accountSid = process.env.TWILIO_ACCOUNT_SID!;
        const authToken = process.env.TWILIO_AUTH_TOKEN!;
        const toFormatted = this.formatPhone(phoneNumber);
        const authHeader =
          'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');

        const response = await fetch(
          `https://verify.twilio.com/v2/Services/${verifyServiceSid}/VerificationCheck`,
          {
            method: 'POST',
            headers: {
              Authorization: authHeader,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              To: toFormatted,
              Code: code,
            }).toString(),
          }
        );

        const data = (await response.json()) as { status?: string };
        if (data.status === 'approved') {
          return { success: true, message: 'OTP verified successfully' };
        }
      } catch (err) {
        console.error('[TWILIO VERIFY SERVICE] Verification check failed:', err);
      }
    }

    return fallbackResult;
  }
}
