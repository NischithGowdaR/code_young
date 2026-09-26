export interface SendOtpResult {
  otpId: string;
  expiresAt: Date;
  cooldownSeconds: number;
  rawCode?: string;
}

export interface VerifyOtpResult {
  success: boolean;
  message: string;
}

export interface IOtpService {
  sendOtp(phoneNumber: string, purpose: string): Promise<SendOtpResult>;
  verifyOtp(phoneNumber: string, purpose: string, code: string): Promise<VerifyOtpResult>;
  resendOtp(phoneNumber: string, purpose: string): Promise<SendOtpResult>;
}
