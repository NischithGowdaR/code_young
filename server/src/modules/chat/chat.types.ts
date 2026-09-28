/**
 * chat.types.ts
 *
 * Shared TypeScript types for the chat module.
 * The xAI Grok API is OpenAI-compatible, so we reuse OpenAI SDK types.
 */

// ─── Action types returned to the frontend ───────────────────────────────────

export type ChatActionType =
  | 'NAVIGATE'
  | 'OPEN_COURSES'
  | 'OPEN_BOOKING'
  | 'OPEN_LOGIN'
  | 'LOGIN_SUCCESS'
  | 'LOGOUT_SUCCESS'
  | 'SHOW_SLOTS';

export interface ChatAction {
  type: ChatActionType;
  payload?: {
    url?: string;
    token?: string;
    refreshToken?: string;
    user?: unknown;
    slots?: AvailableSlotSummary[];
  };
}

// ─── Slot summary exposed to the frontend ────────────────────────────────────

export interface AvailableSlotSummary {
  startUtc: string;
  endUtc: string;
  parentLocalDisplay: string;
  durationMinutes: number;
}

// ─── Chat API request / response ─────────────────────────────────────────────

export interface ChatRequest {
  message: string;
  conversationId?: string;
  /** JWT access token forwarded from the browser (Bearer stripped) */
  authToken?: string;
}

export interface ChatResponse {
  message: string;
  conversationId: string;
  actions: ChatAction[];
}

// ─── Conversation history ─────────────────────────────────────────────────────

export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

export interface ConversationMessage {
  role: MessageRole;
  content: string | null;
  tool_call_id?: string;
  name?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tool_calls?: any[];
}

// ─── Tool result wrapper ──────────────────────────────────────────────────────

export type ToolStatus = 'ok' | 'not_implemented' | 'error' | 'unauthenticated' | 'otp_required';

export interface ToolResult<T = unknown> {
  status: ToolStatus;
  data?: T;
  message?: string;
  /** Which backend service is missing, when status === 'not_implemented' */
  missingService?: string;
}
