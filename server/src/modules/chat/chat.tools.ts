/**
 * chat.tools.ts
 *
 * Grok / OpenAI-compatible tool definitions and dispatcher.
 *
 * Rules:
 * - Grok must never access Prisma or PostgreSQL directly.
 * - Every tool calls an existing backend service.
 * - All tool arguments are validated with Zod before execution.
 * - Unknown tools are rejected.
 * - NOT_IMPLEMENTED is returned when a required service does not yet exist.
 */

import crypto from 'crypto';
import type { ChatCompletionTool } from 'openai/resources/chat/completions.js';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../config/jwt.js';
import { prisma } from '../../utils/prisma.js';
import { getAvailableSlots } from '../../services/availabilityService.js';
import { createBooking } from '../../services/bookingService.js';
import { loginUser } from '../../services/authService.js';
import { getOtpService } from '../../services/otp/otpServiceFactory.js';
import { getEmailService } from '../../services/email/developmentEmailService.js';
import { pendingTrialRequests, PendingTrialRequest } from '../../controllers/trialController.js';
import type { AuthPayload } from '../../types/express.js';
import type { ChatAction, ToolResult } from './chat.types.js';
import {
  getCourseInformationSchema,
  getTrialClassInformationSchema,
  getAuthenticationStatusSchema,
  redirectToLoginSchema,
  getAvailableSlotsSchema,
  sendBookingOtpSchema,
  confirmBookingSchema,
  getMyBookingsSchema,
  redirectToBookingPageSchema,
  loginUserSchema,
  navigateToPageSchema,
} from './chat.schemas.js';

// ─── Tool definitions (sent to Grok) ─────────────────────────────────────────

export const TOOL_DEFINITIONS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_course_information',
      description:
        'Returns information about a specific CodeYoung course (MATH, CODING, ENGLISH, SCIENCE) or all courses if no course is specified.',
      parameters: {
        type: 'object',
        properties: {
          course: {
            type: ['string', 'null'],
            enum: ['MATH', 'CODING', 'ENGLISH', 'SCIENCE', null],
            description: 'The course to get information about. Pass null or omit to get all courses.',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_trial_class_information',
      description:
        'Returns specific information about CodeYoung trial classes such as duration, how they work, mentor assignment, timezone display, class links, login/registration, or how to book.',
      parameters: {
        type: 'object',
        properties: {
          topic: {
            type: ['string', 'null'],
            enum: [
              'duration',
              'how_it_works',
              'mentor_assignment',
              'timezone_display',
              'class_link',
              'login_registration',
              'how_to_book',
              null,
            ],
            description: 'The specific topic to get information about, or null for general overview.',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_authentication_status',
      description:
        'Checks whether the current user is authenticated (logged in). Must be called before initiating any booking flow.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'redirect_to_login',
      description:
        'Returns a frontend action to navigate the user to the login page. Use this when the user needs to log in before booking.',
      parameters: {
        type: 'object',
        properties: {
          reason: {
            type: ['string', 'null'],
            description: 'Brief explanation of why the user needs to log in, or null.',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_available_slots',
      description:
        'Fetches real available trial class slots from the backend for a given date (YYYY-MM-DD) and parent timezone (IANA name). Never invent or fabricate slots — only return what this tool provides.',
      parameters: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            description: 'The date to fetch slots for, in YYYY-MM-DD format.',
          },
          parentTimezone: {
            type: 'string',
            description: 'The parent\'s IANA timezone, e.g. "Asia/Kolkata".',
          },
        },
        required: ['date', 'parentTimezone'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_booking_otp',
      description:
        'Dispatches a 6-digit OTP verification code to the authenticated parent email address for confirming a trial class booking. Call this as soon as the user selects a slot or confirms their booking intention.',
      parameters: {
        type: 'object',
        properties: {
          startUtc: {
            type: ['string', 'null'],
            description: 'The selected slot start time as an ISO 8601 UTC string.',
          },
          course: {
            type: ['string', 'null'],
            enum: ['MATH', 'CODING', 'ENGLISH', 'SCIENCE', null],
            description: 'The chosen course subject.',
          },
          studentGrade: {
            type: ['string', 'null'],
            description: 'The student grade (e.g. "Grade 5").',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'confirm_booking',
      description:
        'Finalizes and locks in a trial class booking ONLY after the user provides the 6-digit OTP verification code sent to their email. Never call this without the OTP code and explicit confirmation.',
      parameters: {
        type: 'object',
        properties: {
          otpCode: {
            type: 'string',
            description: 'The 6-digit OTP verification code received by the user via email (e.g. "123456").',
          },
          startUtc: {
            type: 'string',
            description: 'The selected slot start time as an ISO 8601 UTC string (e.g. 2026-10-01T04:00:00.000Z).',
          },
          course: {
            type: ['string', 'null'],
            enum: ['MATH', 'CODING', 'ENGLISH', 'SCIENCE', null],
            description: 'The chosen course subject (e.g. MATH, CODING, ENGLISH, SCIENCE).',
          },
          studentGrade: {
            type: ['string', 'null'],
            description: 'The student grade (e.g. "Grade 5").',
          },
          parentTimezone: {
            type: ['string', 'null'],
            description: 'The parent local timezone (e.g. "America/New_York").',
          },
          trialRequestId: {
            type: ['string', 'null'],
            description: 'Optional trial request ID if one was previously issued.',
          },
          explicitConfirmation: {
            type: 'boolean',
            description: 'Must be true. Set only after the user has explicitly confirmed the booking.',
          },
        },
        required: ['otpCode', 'startUtc', 'explicitConfirmation'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_my_bookings',
      description: "Retrieves the authenticated user's existing trial class bookings.",
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'redirect_to_booking_page',
      description:
        'Returns a frontend action to navigate the authenticated user to the trial booking page.',
      parameters: {
        type: 'object',
        properties: {
          reason: {
            type: ['string', 'null'],
            description: 'Brief explanation of why the user is being redirected, or null.',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'login_user',
      description:
        'Authenticates and logs in a user using their email and password. Call this when the user explicitly provides their email address and password to log in directly via chat.',
      parameters: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            description: 'The user account email address.',
          },
          password: {
            type: 'string',
            description: 'The user account password.',
          },
        },
        required: ['email', 'password'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'logout_user',
      description:
        'Logs out the current user, terminates their session, and navigates them to the login page. Call this when the user asks to log out or sign out.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'navigate_to_page',
      description:
        'Navigates the user to a specific page on the CodeYoung website (e.g. home, courses, math, coding, english, science, blog, contact, terms, privacy, login, register, dashboard, book_trial). Call this whenever the user asks to go to, visit, or navigate to any page.',
      parameters: {
        type: 'object',
        properties: {
          page: {
            type: 'string',
            enum: [
              'home',
              'courses',
              'math',
              'coding',
              'english',
              'science',
              'blog',
              'contact',
              'terms',
              'privacy',
              'login',
              'register',
              'dashboard',
              'book_trial',
              'admin_dashboard',
              'admin_mentors',
              'admin_bookings',
            ],
            description: 'The destination page name.',
          },
          reason: {
            type: ['string', 'null'],
            description: 'Optional reason for navigation or null.',
          },
        },
        required: ['page'],
      },
    },
  },
];

// ─── Tool context ─────────────────────────────────────────────────────────────

export interface ToolContext {
  /** Raw JWT token from the Authorization header (undefined if unauthenticated) */
  authToken?: string;
  /** Decoded JWT payload (undefined if unauthenticated) */
  authUser?: AuthPayload;
  /** Actions to append to the response */
  actions: ChatAction[];
}

// ─── Tool dispatcher ──────────────────────────────────────────────────────────

export async function dispatchTool(
  toolName: string,
  rawArgs: unknown,
  ctx: ToolContext
): Promise<string> {
  switch (toolName) {
    case 'get_course_information':
      return handleGetCourseInformation(rawArgs);
    case 'get_trial_class_information':
      return handleGetTrialClassInformation(rawArgs);
    case 'get_authentication_status':
      return handleGetAuthenticationStatus(rawArgs, ctx);
    case 'redirect_to_login':
      return handleRedirectToLogin(rawArgs, ctx);
    case 'get_available_slots':
      return handleGetAvailableSlots(rawArgs, ctx);
    case 'send_booking_otp':
      return handleSendBookingOtp(rawArgs, ctx);
    case 'confirm_booking':
      return handleConfirmBooking(rawArgs, ctx);
    case 'get_my_bookings':
      return handleGetMyBookings(rawArgs, ctx);
    case 'redirect_to_booking_page':
      return handleRedirectToBookingPage(rawArgs, ctx);
    case 'login_user':
      return handleLoginUser(rawArgs, ctx);
    case 'logout_user':
      return handleLogoutUser(rawArgs, ctx);
    case 'navigate_to_page':
      return handleNavigateToPage(rawArgs, ctx);
    default:
      return toolError(`Unknown tool: "${toolName}". Only registered tools are allowed.`);
  }
}

// ─── Individual tool handlers ─────────────────────────────────────────────────

function handleGetCourseInformation(rawArgs: unknown): string {
  const parse = getCourseInformationSchema.safeParse(rawArgs);
  if (!parse.success) {
    return toolError(formatZodError(parse.error));
  }
  const { course } = parse.data;

  const courses = {
    MATH: {
      name: 'STEM Mathematics',
      ageRange: '5–16',
      description:
        'Master mental math tricks, logic puzzles, spatial reasoning, and Math Olympiad preparation.',
      highlights: ['Mental Math Tricks', 'Logic & Aptitude', 'Olympiad Prep'],
      path: '/courses/math',
    },
    CODING: {
      name: 'Coding for Kids',
      ageRange: '6–17',
      description:
        'Build games, apps, Python scripts, and learn fundamentals of AI & Web Development.',
      highlights: ['Scratch & Block Coding', 'Python & JavaScript', 'AI & Game Logic'],
      path: '/courses/coding',
      badge: 'Most Popular',
    },
    ENGLISH: {
      name: 'English Communication',
      ageRange: '5–15',
      description:
        'Develop strong vocabulary, public speaking, creative writing, and persuasive speech.',
      highlights: ['Public Speaking', 'Phonics & Grammar', 'Creative Writing'],
      path: '/courses/english',
    },
    SCIENCE: {
      name: 'Interactive Science',
      ageRange: '7–16',
      description:
        'Discover Physics, Chemistry, Biology, and astronomy through virtual experiment labs.',
      highlights: ['Virtual Experiment Labs', 'Physics & Chemistry', 'Real-world Science'],
      path: '/courses/science',
    },
  };

  const result: ToolResult =
    course && courses[course]
      ? { status: 'ok', data: courses[course] }
      : { status: 'ok', data: courses };

  return JSON.stringify(result);
}

function handleGetTrialClassInformation(rawArgs: unknown): string {
  const parse = getTrialClassInformationSchema.safeParse(rawArgs);
  if (!parse.success) {
    return toolError(formatZodError(parse.error));
  }
  const { topic } = parse.data;

  const info: Record<string, string> = {
    duration: 'Each trial class lasts exactly 45 minutes.',
    how_it_works:
      'A CodeYoung trial class is a live, 1-on-1 online session between your child and an expert mentor. You select a subject, pick a date and time, and a mentor is automatically matched. A secure video link is generated after booking.',
    mentor_assignment:
      'Mentors are expert-vetted educators. Our algorithm automatically matches the least-loaded eligible mentor who is available during your chosen slot. You do not choose the mentor manually for trial classes.',
    timezone_display:
      'Slot times are shown in your local timezone (e.g. Asia/Kolkata). The mentor sees the same slot in their own local timezone. Both are stored in UTC on our servers.',
    class_link:
      'A unique dummy class link (https://meet.codeyoung.example/room/cy-XXXXXXXX) is generated after booking confirmation. It is sent via email to both the parent and the mentor.',
    login_registration:
      'To book a trial class, you must create a free account and verify your phone number. Visit /register to sign up or /login to log in.',
    how_to_book:
      '1. Log in or register at /login. 2. Go to the dashboard and click "Book a Trial Class". 3. Select your course, student grade, and preferred date. 4. Choose an available time slot. 5. Confirm your booking. You can also ask me to guide you through the booking process.',
  };

  const data = topic ? { [topic]: info[topic] } : info;
  return JSON.stringify({ status: 'ok', data } as ToolResult);
}

function handleGetAuthenticationStatus(rawArgs: unknown, ctx: ToolContext): string {
  const parse = getAuthenticationStatusSchema.safeParse(rawArgs);
  if (!parse.success) {
    return toolError(formatZodError(parse.error));
  }

  if (ctx.authUser) {
    return JSON.stringify({
      status: 'ok',
      data: {
        authenticated: true,
        userId: ctx.authUser.userId,
        email: ctx.authUser.email,
        role: ctx.authUser.role,
      },
    } as ToolResult);
  }

  return JSON.stringify({
    status: 'unauthenticated',
    data: { authenticated: false },
    message: 'User is not logged in.',
  } as ToolResult);
}

function handleRedirectToLogin(rawArgs: unknown, ctx: ToolContext): string {
  const parse = redirectToLoginSchema.safeParse(rawArgs);
  if (!parse.success) {
    return toolError(formatZodError(parse.error));
  }

  ctx.actions.push({
    type: 'NAVIGATE',
    payload: { url: '/login' },
  });

  return JSON.stringify({
    status: 'ok',
    data: { action: 'NAVIGATE', url: '/login' },
    message: 'Navigation action added. Please inform the user to log in.',
  } as ToolResult);
}

async function handleGetAvailableSlots(rawArgs: unknown, ctx: ToolContext): Promise<string> {
  const parse = getAvailableSlotsSchema.safeParse(rawArgs);
  if (!parse.success) {
    return toolError(formatZodError(parse.error));
  }

  if (!ctx.authUser) {
    return JSON.stringify({
      status: 'unauthenticated',
      message: 'Authentication required to fetch available slots.',
    } as ToolResult);
  }

  const { date, parentTimezone } = parse.data;

  try {
    const slots = await getAvailableSlots({ dateStr: date, parentTz: parentTimezone });

    if (slots.length === 0) {
      return JSON.stringify({
        status: 'ok',
        data: { slots: [], count: 0 },
        message: `No available slots found for ${date} in ${parentTimezone}. Please try a different date.`,
      } as ToolResult);
    }

    const slotSummaries = slots.map((s) => ({
      startUtc: s.startUtc,
      endUtc: s.endUtc,
      parentLocalDisplay: s.parentLocalDisplay,
      durationMinutes: s.durationMinutes,
    }));

    ctx.actions.push({
      type: 'SHOW_SLOTS',
      payload: { slots: slotSummaries },
    });

    return JSON.stringify({
      status: 'ok',
      data: { slots: slotSummaries, count: slotSummaries.length },
    } as ToolResult);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch available slots.';
    return JSON.stringify({ status: 'error', message } as ToolResult);
  }
}

async function handleSendBookingOtp(rawArgs: unknown, ctx: ToolContext): Promise<string> {
  const parse = sendBookingOtpSchema.safeParse(rawArgs);
  if (!parse.success) {
    return toolError(formatZodError(parse.error));
  }

  if (!ctx.authUser) {
    return JSON.stringify({
      status: 'unauthenticated',
      message: 'Authentication required to book a trial class. Please log in first.',
    } as ToolResult);
  }

  const user = await prisma.user.findUnique({
    where: { id: ctx.authUser.userId },
  });

  if (!user) {
    return toolError('User account not found.');
  }

  const otpService = getOtpService();
  const phoneOrEmail = user.phoneNumber || user.email;
  const result = await otpService.sendOtp(phoneOrEmail, 'PHONE_VERIFICATION');

  if (result.rawCode && user.email) {
    const emailService = getEmailService();
    try {
      await emailService.sendOtpEmail(user.email, user.name, result.rawCode);
    } catch (err) {
      console.error('[BOOKING OTP EMAIL DISPATCH ERROR]:', err);
    }
  }

  return JSON.stringify({
    status: 'ok',
    message: `A 6-digit verification code has been sent to your email address (${user.email}). Please enter the 6-digit code here to finalize and confirm your trial class booking.`,
    data: {
      sentTo: user.email,
      cooldownSeconds: result.cooldownSeconds,
    },
  } as ToolResult);
}

async function handleConfirmBooking(rawArgs: unknown, ctx: ToolContext): Promise<string> {
  const parse = confirmBookingSchema.safeParse(rawArgs);
  if (!parse.success) {
    return toolError(formatZodError(parse.error));
  }

  if (!ctx.authUser) {
    return JSON.stringify({
      status: 'unauthenticated',
      message: 'Authentication required to confirm a booking. Please log in first.',
    } as ToolResult);
  }

  const { otpCode, startUtc, course, studentGrade, parentTimezone } = parse.data;
  let { trialRequestId } = parse.data;

  // Look up user details in the database
  const user = await prisma.user.findUnique({
    where: { id: ctx.authUser.userId },
  });

  if (!user) {
    return toolError('User account not found.');
  }

  const phoneOrEmail = user.phoneNumber || user.email;

  // 1. If no OTP code was supplied, send OTP and ask user to provide the code
  if (!otpCode || otpCode.trim() === '') {
    const otpService = getOtpService();
    const result = await otpService.sendOtp(phoneOrEmail, 'PHONE_VERIFICATION');

    if (result.rawCode && user.email) {
      const emailService = getEmailService();
      try {
        await emailService.sendOtpEmail(user.email, user.name, result.rawCode);
      } catch (err) {
        console.error('[BOOKING OTP EMAIL ERROR]:', err);
      }
    }

    return JSON.stringify({
      status: 'otp_required',
      message: `A 6-digit verification code has been sent to your email (${user.email}). Please enter the 6-digit code to finalize your booking.`,
      data: {
        sentTo: user.email,
        requiresOtp: true,
      },
    } as ToolResult);
  }

  // 2. Verify the submitted OTP code
  const otpService = getOtpService();
  try {
    await otpService.verifyOtp(phoneOrEmail, 'PHONE_VERIFICATION', otpCode.trim());
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invalid OTP code.';
    return toolError(
      `OTP verification failed: ${msg}. Please check your email for the 6-digit code or request a new code.`
    );
  }

  // 3. Now that OTP is verified, proceed to create booking
  try {
    let trialRequest: PendingTrialRequest | undefined;
    if (trialRequestId) {
      trialRequest = pendingTrialRequests.get(trialRequestId);
    }

    if (!trialRequest) {
      for (const req of pendingTrialRequests.values()) {
        if (req.parentEmail.toLowerCase() === ctx.authUser.email.toLowerCase()) {
          trialRequest = req;
          trialRequestId = req.id;
          break;
        }
      }
    }

    if (!trialRequest) {
      const generatedId = `tr_${crypto.randomUUID()}`;
      const selectedCourse = course || 'MATH';
      const selectedGrade = studentGrade || 'Grade 5';
      const selectedTz = parentTimezone || user.timezone || 'Asia/Kolkata';

      trialRequest = {
        id: generatedId,
        parentName: user.name,
        parentEmail: user.email.toLowerCase(),
        parentPhone: user.phoneNumber || '+15550000000',
        studentGrade: selectedGrade,
        studentSubject: selectedCourse,
        course: selectedCourse,
        timezone: selectedTz,
        phoneVerified: true,
        verifiedAt: new Date(),
        createdAt: new Date(),
      };

      pendingTrialRequests.set(generatedId, trialRequest);
      trialRequestId = generatedId;
    } else {
      trialRequest.phoneVerified = true;
      trialRequest.verifiedAt = new Date();
      if (course) trialRequest.course = course;
      if (studentGrade) trialRequest.studentGrade = studentGrade;
      if (parentTimezone) trialRequest.timezone = parentTimezone;
    }

    const booking = await createBooking({
      trialRequestId: trialRequestId!,
      startUtc,
      userId: ctx.authUser.userId,
      userEmail: ctx.authUser.email,
    });

    return JSON.stringify({
      status: 'ok',
      message: `Your trial class has been successfully booked! 🎉`,
      data: {
        bookingId: booking.id,
        mentorName: booking.mentorName,
        course: booking.course,
        studentGrade: booking.studentGrade,
        parentLocalDisplay: booking.parentLocalDisplay,
        mentorLocalDisplay: booking.mentorLocalDisplay,
        classLink: booking.classLink,
        status: booking.status,
        notificationsRequested: true,
      },
    } as ToolResult);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Booking failed.';
    if (message.includes('No mentor') || message.includes('NO_MENTOR_AVAILABLE')) {
      return JSON.stringify({
        status: 'error',
        message: 'No mentor is available for that time slot. Please select another slot.',
      } as ToolResult);
    }
    return JSON.stringify({ status: 'error', message } as ToolResult);
  }
}

function handleGetMyBookings(rawArgs: unknown, ctx: ToolContext): string {
  const parse = getMyBookingsSchema.safeParse(rawArgs);
  if (!parse.success) {
    return toolError(formatZodError(parse.error));
  }

  if (!ctx.authUser) {
    return JSON.stringify({
      status: 'unauthenticated',
      message: 'Authentication required to view bookings.',
    } as ToolResult);
  }

  // This would require a dedicated service function to list bookings by parent ID.
  // That service does not yet exist — return NOT_IMPLEMENTED.
  return JSON.stringify({
    status: 'not_implemented',
    message:
      'The "get my bookings" feature is not yet available via the chatbot. Please visit your dashboard to view your bookings.',
    missingService: 'bookingService.getBookingsByParentId',
  } as ToolResult);
}

function handleRedirectToBookingPage(rawArgs: unknown, ctx: ToolContext): string {
  const parse = redirectToBookingPageSchema.safeParse(rawArgs);
  if (!parse.success) {
    return toolError(formatZodError(parse.error));
  }

  ctx.actions.push({
    type: 'NAVIGATE',
    payload: { url: '/dashboard/book-trial' },
  });

  return JSON.stringify({
    status: 'ok',
    data: { action: 'NAVIGATE', url: '/dashboard/book-trial' },
    message: 'Navigation action added.',
  } as ToolResult);
}

async function handleLoginUser(rawArgs: unknown, ctx: ToolContext): Promise<string> {
  const parse = loginUserSchema.safeParse(rawArgs);
  if (!parse.success) {
    return toolError(formatZodError(parse.error));
  }

  const { email, password } = parse.data;

  try {
    const result = await loginUser({ email, password });

    ctx.actions.push({
      type: 'LOGIN_SUCCESS',
      payload: {
        token: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
        url: result.user.role === 'ADMIN' ? '/admin' : '/dashboard',
      },
    });

    return JSON.stringify({
      status: 'ok',
      message: `Successfully authenticated as ${result.user.name} (${result.user.email}). Redirecting to dashboard.`,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        timezone: result.user.timezone,
      },
    } as ToolResult);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invalid email or password';
    return toolError(
      `Authentication failed: ${msg}. Please check your credentials or use the Login page to reset your password.`
    );
  }
}

function handleLogoutUser(_rawArgs: unknown, ctx: ToolContext): string {
  ctx.actions.push({
    type: 'LOGOUT_SUCCESS',
    payload: { url: '/login' },
  });

  return JSON.stringify({
    status: 'ok',
    message: 'You have been successfully logged out. Redirecting to the login page.',
  } as ToolResult);
}

const PAGE_ROUTE_MAP: Record<string, { path: string; name: string }> = {
  home: { path: '/', name: 'Home' },
  courses: { path: '/#courses', name: 'Courses' },
  math: { path: '/courses/math', name: 'STEM Mathematics' },
  coding: { path: '/courses/coding', name: 'Coding for Kids' },
  english: { path: '/courses/english', name: 'English Communication' },
  science: { path: '/courses/science', name: 'Applied Science' },
  blog: { path: '/blog', name: 'Blog & Articles' },
  contact: { path: '/contact', name: 'Contact Us' },
  terms: { path: '/terms', name: 'Terms of Service' },
  privacy: { path: '/privacy', name: 'Privacy Policy' },
  login: { path: '/login', name: 'Login' },
  register: { path: '/register', name: 'Create Account' },
  dashboard: { path: '/dashboard', name: 'Parent Dashboard' },
  book_trial: { path: '/dashboard/book-trial', name: 'Book Free Trial' },
  admin_dashboard: { path: '/admin', name: 'Admin Dashboard' },
  admin_mentors: { path: '/admin/mentors', name: 'Admin Mentors Management' },
  admin_bookings: { path: '/admin/bookings', name: 'Admin Bookings Management' },
};

function handleNavigateToPage(rawArgs: unknown, ctx: ToolContext): string {
  const parse = navigateToPageSchema.safeParse(rawArgs);
  if (!parse.success) {
    return toolError(formatZodError(parse.error));
  }

  const { page } = parse.data;
  const target = PAGE_ROUTE_MAP[page] || { path: '/', name: 'Home' };

  ctx.actions.push({
    type: 'NAVIGATE',
    payload: { url: target.path },
  });

  return JSON.stringify({
    status: 'ok',
    message: `Navigating to ${target.name} (${target.path}).`,
    data: {
      page,
      name: target.name,
      url: target.path,
    },
  } as ToolResult);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Decode and verify JWT silently; returns undefined on any error */
export function decodeAuthToken(token: string | undefined): AuthPayload | undefined {
  if (!token) return undefined;
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return undefined;
  }
}

function toolError(message: string): string {
  return JSON.stringify({ status: 'error', message } as ToolResult);
}

function formatZodError(err: z.ZodError): string {
  return err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
}
