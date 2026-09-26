import crypto from 'crypto';
import path from 'path';
import dotenv from 'dotenv';
import nodemailer, { type Transporter } from 'nodemailer';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import {
  IEmailService,
  EmailPayload,
  BookingConfirmationEmailParams,
  BookingCancellationEmailParams,
} from './emailService.interface.js';

export interface SentEmailLogRecord {
  messageId: string;
  to: string;
  subject: string;
  sentAt: Date;
  type: 'CONFIRMATION' | 'CANCELLATION' | 'GENERIC' | 'OTP';
  params: Record<string, unknown>;
}

/**
 * Email Service with Nodemailer SMTP transport for real email delivery,
 * and safe development in-memory logging fallback.
 */
export class DevelopmentEmailService implements IEmailService {
  public sentEmails: SentEmailLogRecord[] = [];

  private getTransporter(): Transporter | null {
    if (process.env.NODE_ENV === 'test') {
      return null;
    }

    const user = process.env.SMTP_USER || 'nischitgowdar71@gmail.com';
    const rawPass = process.env.SMTP_PASS || 'wpwv bkzk wkcs nuyw';
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';

    if (!user || !rawPass) {
      return null;
    }

    const pass = rawPass.replace(/['"\s]+/g, '');

    try {
      if (host.toLowerCase().includes('gmail') || user.toLowerCase().includes('@gmail.com')) {
        return nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: user.trim(),
            pass,
          },
          connectionTimeout: 4000,
          greetingTimeout: 4000,
          socketTimeout: 5000,
        });
      }

      return nodemailer.createTransport({
        host: host.trim(),
        port: parseInt(process.env.SMTP_PORT || '465', 10),
        secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
        auth: {
          user: user.trim(),
          pass,
        },
        connectionTimeout: 4000,
        greetingTimeout: 4000,
        socketTimeout: 5000,
      });
    } catch (err) {
      console.error('[EMAIL SERVICE] Failed to create nodemailer SMTP transporter:', err);
      return null;
    }
  }

  private getFromAddress(): string {
    const user = process.env.SMTP_USER || 'nischitgowdar71@gmail.com';
    return `"CodeYoung" <${user.trim()}>`;
  }

  async sendEmail(payload: EmailPayload): Promise<{ success: boolean; messageId: string }> {
    const messageId = `msg_dev_${crypto.randomUUID()}`;
    const record: SentEmailLogRecord = {
      messageId,
      to: payload.to,
      subject: payload.subject,
      sentAt: new Date(),
      type: 'GENERIC',
      params: { textBody: payload.textBody },
    };

    this.sentEmails.push(record);

    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey.trim()}`,
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM || 'CodeYoung <onboarding@resend.dev>',
            to: [payload.to],
            subject: payload.subject,
            text: payload.textBody,
            html: payload.htmlBody,
          }),
        });
        if (res.ok) {
          console.log(`[RESEND API] Successfully sent email to ${payload.to}`);
          return { success: true, messageId };
        }
      } catch (err) {
        console.error('[RESEND API ERROR]:', err);
      }
    }

    const transporter = this.getTransporter();
    if (transporter) {
      try {
        await transporter.sendMail({
          from: this.getFromAddress(),
          to: payload.to,
          subject: payload.subject,
          text: payload.textBody,
          html: payload.htmlBody,
        });
        console.log(`[EMAIL SERVICE] Successfully delivered SMTP email to ${payload.to}`);
      } catch (err) {
        console.error(`[EMAIL SERVICE] Failed to deliver SMTP email to ${payload.to}:`, err);
      }
    } else {
      if (process.env.NODE_ENV !== 'test') {
        console.log(
          `[DEV EMAIL SERVICE] (No SMTP credentials) Logged email to ${payload.to} | Subject: "${payload.subject}"`
        );
      }
    }

    return { success: true, messageId };
  }

  async sendOtpEmail(
    email: string,
    name: string,
    code: string
  ): Promise<{ success: boolean; messageId: string }> {
    const subject = `Your CodeYoung Verification Code: ${code}`;
    const textBody = `Hello ${name || 'Parent'},\n\nYour 6-digit verification code is: ${code}\n\nThis code will expire in 10 minutes. If you did not request this code, please ignore this email.\n\nBest regards,\nCodeYoung Team`;
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #4f46e5; margin-bottom: 8px;">CodeYoung Verification</h2>
        <p style="color: #475569; font-size: 14px;">Hello <strong>${name || 'Parent'}</strong>,</p>
        <p style="color: #475569; font-size: 14px;">Use the verification code below to verify your account:</p>
        <div style="background-color: #f1f5f9; padding: 18px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e293b; font-family: monospace;">${code}</span>
        </div>
        <p style="color: #94a3b8; font-size: 12px;">This code will expire in 10 minutes. Never share this code with anyone.</p>
      </div>
    `;

    const messageId = `msg_otp_${crypto.randomUUID()}`;
    const record: SentEmailLogRecord = {
      messageId,
      to: email,
      subject,
      sentAt: new Date(),
      type: 'OTP',
      params: { textBody, htmlBody, code },
    };

    this.sentEmails.push(record);

    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey.trim()}`,
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM || 'CodeYoung <onboarding@resend.dev>',
            to: [email],
            subject,
            text: textBody,
            html: htmlBody,
          }),
        });
        const resData = await res.json().catch(() => ({}));
        if (res.ok) {
          console.log(`[RESEND API SUCCESS] Delivered OTP email to ${email}:`, resData);
          return { success: true, messageId };
        } else {
          console.error(`[RESEND API ERROR ${res.status}] to ${email}:`, resData);
        }
      } catch (err) {
        console.error('[RESEND API NETWORK ERROR]:', err);
      }
    }

    const brevoApiKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
    if (brevoApiKey) {
      try {
        const res = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': brevoApiKey.trim(),
          },
          body: JSON.stringify({
            sender: { name: 'CodeYoung', email: process.env.SMTP_USER || 'nischitgowdar71@gmail.com' },
            to: [{ email, name: name || 'Parent' }],
            subject,
            textContent: textBody,
            htmlContent: htmlBody,
          }),
        });
        const resData = await res.json().catch(() => ({}));
        if (res.ok) {
          console.log(`[BREVO API SUCCESS] Delivered OTP email to ${email}:`, resData);
          return { success: true, messageId };
        } else {
          console.error(`[BREVO API ERROR ${res.status}] to ${email}:`, resData);
        }
      } catch (err) {
        console.error('[BREVO API NETWORK ERROR]:', err);
      }
    }

    const transporter = this.getTransporter();
    if (transporter) {
      try {
        await transporter.sendMail({
          from: this.getFromAddress(),
          to: email,
          subject,
          text: textBody,
          html: htmlBody,
        });
        console.log(`[EMAIL OTP] Successfully delivered real OTP [${code}] to ${email}`);
      } catch (err) {
        console.error(`[EMAIL OTP] Failed to deliver real OTP to ${email}:`, err);
      }
    } else {
      if (process.env.NODE_ENV !== 'test') {
        console.log(`[EMAIL OTP] (No SMTP/API configured) Code [${code}] for ${email}`);
      }
    }

    return { success: true, messageId };
  }

  async sendBookingConfirmation(
    params: BookingConfirmationEmailParams
  ): Promise<{ success: boolean; messageId: string }> {
    const messageId = `msg_conf_${crypto.randomUUID()}`;
    const subject = params.isParent
      ? `Booking Confirmed: ${params.course} Trial Class with CodeYoung`
      : `New Trial Class Assigned: ${params.course} (${params.studentGrade})`;

    let textBody = '';
    let htmlBody = '';

    if (params.isParent) {
      textBody = `Dear ${params.recipientName},\n\nYour trial class for ${params.course} (${params.studentGrade}) has been successfully booked!\n\nDetails:\n- Course: ${params.course}\n- Grade: ${params.studentGrade}\n- Mentor: ${params.mentorName || 'Assigned Mentor'}\n- Time: ${params.localTimeFormatted}\n- Class Link: ${params.classLink}\n\nWe look forward to meeting you!\n\nBest regards,\nCodeYoung Team`;
      htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #4f46e5; margin-bottom: 12px;">Trial Class Booking Confirmed 🎉</h2>
          <p style="color: #334155; font-size: 14px;">Dear <strong>${params.recipientName}</strong>,</p>
          <p style="color: #334155; font-size: 14px;">Your trial class for <strong>${params.course}</strong> (${params.studentGrade}) is confirmed!</p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 4px 0; color: #475569; font-size: 14px;"><strong>Mentor:</strong> ${params.mentorName || 'Assigned Mentor'}</p>
            <p style="margin: 4px 0; color: #475569; font-size: 14px;"><strong>Your Local Time:</strong> ${params.localTimeFormatted}</p>
            <p style="margin: 4px 0; color: #475569; font-size: 14px;"><strong>Live Classroom:</strong> <a href="${params.classLink}" style="color: #4f46e5; font-weight: bold;">${params.classLink}</a></p>
          </div>
          <p style="color: #94a3b8; font-size: 12px;">Please join the classroom 5 minutes before start time.</p>
        </div>
      `;
    } else {
      textBody = `Hello ${params.recipientName},\n\nYou have been assigned a new trial class session.\n\nDetails:\n- Student Parent: ${params.parentName || 'Student Parent'}\n- Course: ${params.course}\n- Grade: ${params.studentGrade}\n- Mentor Local Time: ${params.localTimeFormatted}\n- Class Link: ${params.classLink}\n\nPlease join on time!\n\nBest regards,\nCodeYoung Team`;
      htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #4f46e5; margin-bottom: 12px;">New Trial Class Assignment 📅</h2>
          <p style="color: #334155; font-size: 14px;">Hello <strong>${params.recipientName}</strong>,</p>
          <p style="color: #334155; font-size: 14px;">You have a new trial class assigned:</p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 4px 0; color: #475569; font-size: 14px;"><strong>Student Parent:</strong> ${params.parentName || 'Student Parent'}</p>
            <p style="margin: 4px 0; color: #475569; font-size: 14px;"><strong>Course:</strong> ${params.course} (${params.studentGrade})</p>
            <p style="margin: 4px 0; color: #475569; font-size: 14px;"><strong>Mentor Local Time:</strong> ${params.localTimeFormatted}</p>
            <p style="margin: 4px 0; color: #475569; font-size: 14px;"><strong>Class Link:</strong> <a href="${params.classLink}" style="color: #4f46e5; font-weight: bold;">${params.classLink}</a></p>
          </div>
        </div>
      `;
    }

    const record: SentEmailLogRecord = {
      messageId,
      to: params.recipientEmail,
      subject,
      sentAt: new Date(),
      type: 'CONFIRMATION',
      params: { ...params, textBody, htmlBody },
    };

    this.sentEmails.push(record);

    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey.trim()}`,
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM || 'CodeYoung <onboarding@resend.dev>',
            to: [params.recipientEmail],
            subject,
            text: textBody,
            html: htmlBody,
          }),
        });
        if (res.ok) {
          console.log(`[RESEND API] Successfully sent confirmation email to ${params.recipientEmail}`);
          return { success: true, messageId };
        }
      } catch (err) {
        console.error('[RESEND API ERROR]:', err);
      }
    }

    const brevoApiKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
    if (brevoApiKey) {
      try {
        const res = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': brevoApiKey.trim(),
          },
          body: JSON.stringify({
            sender: { name: 'CodeYoung', email: process.env.SMTP_USER || 'nischitgowdar71@gmail.com' },
            to: [{ email: params.recipientEmail, name: params.recipientName }],
            subject,
            textContent: textBody,
            htmlContent: htmlBody,
          }),
        });
        const resData = await res.json().catch(() => ({}));
        if (res.ok) {
          console.log(`[BREVO API SUCCESS] Delivered confirmation email to ${params.recipientEmail}:`, resData);
          return { success: true, messageId };
        } else {
          console.error(`[BREVO API ERROR ${res.status}] to ${params.recipientEmail}:`, resData);
        }
      } catch (err) {
        console.error('[BREVO API NETWORK ERROR]:', err);
      }
    }

    const transporter = this.getTransporter();
    if (transporter) {
      try {
        await transporter.sendMail({
          from: this.getFromAddress(),
          to: params.recipientEmail,
          subject,
          text: textBody,
          html: htmlBody,
        });
        console.log(
          `[EMAIL SERVICE] Successfully delivered confirmation email to ${params.recipientEmail}`
        );
      } catch (err) {
        console.error(
          `[EMAIL SERVICE] Failed to deliver confirmation email to ${params.recipientEmail}:`,
          err
        );
      }
    } else {
      if (process.env.NODE_ENV !== 'test') {
        console.log(
          `[DEV EMAIL SERVICE] (No SMTP configured) Logged ${params.isParent ? 'Parent' : 'Mentor'} confirmation for ${params.recipientEmail}`
        );
      }
    }

    return { success: true, messageId };
  }

  async sendBookingCancellation(
    params: BookingCancellationEmailParams
  ): Promise<{ success: boolean; messageId: string }> {
    const messageId = `msg_cancel_${crypto.randomUUID()}`;
    const subject = `Trial Class Cancelled: ${params.course}`;

    const textBody = `Hello ${params.recipientName},\n\nYour trial class session for ${params.course} scheduled at ${params.localTimeFormatted} has been cancelled.\n${params.reason ? `Reason: ${params.reason}\n` : ''}\nBest regards,\nCodeYoung Team`;
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #e11d48; margin-bottom: 12px;">Trial Class Cancelled</h2>
        <p style="color: #334155; font-size: 14px;">Hello <strong>${params.recipientName}</strong>,</p>
        <p style="color: #334155; font-size: 14px;">Your trial class session for <strong>${params.course}</strong> scheduled at <strong>${params.localTimeFormatted}</strong> has been cancelled.</p>
        ${params.reason ? `<p style="color: #64748b; font-size: 13px;"><strong>Reason:</strong> ${params.reason}</p>` : ''}
      </div>
    `;

    const record: SentEmailLogRecord = {
      messageId,
      to: params.recipientEmail,
      subject,
      sentAt: new Date(),
      type: 'CANCELLATION',
      params: { ...params, textBody, htmlBody },
    };

    this.sentEmails.push(record);

    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey.trim()}`,
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM || 'CodeYoung <onboarding@resend.dev>',
            to: [params.recipientEmail],
            subject,
            text: textBody,
            html: htmlBody,
          }),
        });
        if (res.ok) {
          console.log(`[RESEND API] Successfully sent cancellation email to ${params.recipientEmail}`);
          return { success: true, messageId };
        }
      } catch (err) {
        console.error('[RESEND API ERROR]:', err);
      }
    }

    const brevoApiKeyCancel = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
    if (brevoApiKeyCancel) {
      try {
        const res = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': brevoApiKeyCancel.trim(),
          },
          body: JSON.stringify({
            sender: { name: 'CodeYoung', email: process.env.SMTP_USER || 'nischitgowdar71@gmail.com' },
            to: [{ email: params.recipientEmail, name: params.recipientName }],
            subject,
            textContent: textBody,
            htmlContent: htmlBody,
          }),
        });
        const resData = await res.json().catch(() => ({}));
        if (res.ok) {
          console.log(`[BREVO API SUCCESS] Delivered cancellation email to ${params.recipientEmail}:`, resData);
          return { success: true, messageId };
        } else {
          console.error(`[BREVO API ERROR ${res.status}] to ${params.recipientEmail}:`, resData);
        }
      } catch (err) {
        console.error('[BREVO API NETWORK ERROR]:', err);
      }
    }

    const transporter = this.getTransporter();
    if (transporter) {
      try {
        await transporter.sendMail({
          from: this.getFromAddress(),
          to: params.recipientEmail,
          subject,
          text: textBody,
          html: htmlBody,
        });
        console.log(
          `[EMAIL SERVICE] Successfully delivered cancellation email to ${params.recipientEmail}`
        );
      } catch (err) {
        console.error(
          `[EMAIL SERVICE] Failed to deliver cancellation email to ${params.recipientEmail}:`,
          err
        );
      }
    } else {
      if (process.env.NODE_ENV !== 'test') {
        console.log(
          `[DEV EMAIL SERVICE] (No SMTP configured) Logged cancellation for ${params.recipientEmail}`
        );
      }
    }

    return { success: true, messageId };
  }
}

let emailServiceInstance: IEmailService | null = null;

export function getEmailService(): IEmailService {
  if (!emailServiceInstance) {
    emailServiceInstance = new DevelopmentEmailService();
  }
  return emailServiceInstance;
}

export function setEmailService(service: IEmailService): void {
  emailServiceInstance = service;
}

