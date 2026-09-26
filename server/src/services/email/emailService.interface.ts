export interface EmailPayload {
  to: string;
  subject: string;
  htmlBody: string;
  textBody: string;
}

export interface BookingConfirmationEmailParams {
  recipientEmail: string;
  recipientName: string;
  isParent: boolean;
  parentName?: string;
  mentorName?: string;
  course: string;
  studentGrade: string;
  localTimeFormatted: string;
  classLink: string;
}

export interface BookingCancellationEmailParams {
  recipientEmail: string;
  recipientName: string;
  isParent: boolean;
  course: string;
  studentGrade: string;
  localTimeFormatted: string;
  reason?: string;
}

export interface IEmailService {
  sendEmail(payload: EmailPayload): Promise<{ success: boolean; messageId: string }>;
  sendOtpEmail(
    email: string,
    name: string,
    code: string
  ): Promise<{ success: boolean; messageId: string }>;
  sendBookingConfirmation(
    params: BookingConfirmationEmailParams
  ): Promise<{ success: boolean; messageId: string }>;
  sendBookingCancellation(
    params: BookingCancellationEmailParams
  ): Promise<{ success: boolean; messageId: string }>;
}
