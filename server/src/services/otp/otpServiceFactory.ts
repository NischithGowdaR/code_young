import { IOtpService } from './otpService.interface.js';
import { DevelopmentOtpService } from './developmentOtpService.js';
import { TwilioOtpService } from './twilioOtpService.js';

export const getOtpService = (): IOtpService => {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    return new TwilioOtpService();
  }
  return new DevelopmentOtpService();
};
