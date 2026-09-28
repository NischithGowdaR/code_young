/**
 * chat.service.ts
 *
 * Core service: manages conversation history, calls the Groq API (OpenAI-compatible),
 * handles tool call loops, and returns a typed ChatResponse.
 *
 * Security:
 * - GROQ_API_KEY is read from environment only — never logged or exposed to the client.
 * - Conversation history is stored in-process (Map). For production, replace with Redis.
 */

import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions.js';
import { randomUUID } from 'crypto';
import { SYSTEM_PROMPT } from './chat.prompts.js';
import { TOOL_DEFINITIONS, dispatchTool, decodeAuthToken, type ToolContext } from './chat.tools.js';
import type { ChatRequest, ChatResponse, ConversationMessage, ChatAction } from './chat.types.js';

// ─── Feature-flag helpers ─────────────────────────────────────────────────────

function isChatEnabled(): boolean {
  return (
    process.env.AI_CHAT_ENABLED === 'true' &&
    typeof process.env.GROQ_API_KEY === 'string' &&
    process.env.GROQ_API_KEY.length > 0
  );
}

// ─── Groq client (lazy singleton) ────────────────────────────────────────────

let _groqClient: OpenAI | undefined;

function getGroqClient(): OpenAI {
  if (!_groqClient) {
    _groqClient = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
      timeout: 30_000, // 30-second timeout per call
    });
  }
  return _groqClient;
}

// ─── In-memory conversation store ────────────────────────────────────────────
// Maps conversationId -> message history (excluding system prompt)

const conversationStore = new Map<string, ConversationMessage[]>();

const MAX_HISTORY_MESSAGES = 40; // Trim to avoid token bloat
const MAX_TOOL_CALL_ROUNDS = 6; // Prevent infinite tool loops

// ─── Main service function ────────────────────────────────────────────────────

export async function processChatMessage(req: ChatRequest): Promise<ChatResponse> {
  // Fallback if feature is disabled or API key is missing
  if (!isChatEnabled()) {
    return {
      message:
        "I'm currently unavailable. Please use the **Login** or **Book a Free Trial** button to continue.",
      conversationId: req.conversationId ?? randomUUID(),
      actions: [],
    };
  }

  const conversationId = req.conversationId ?? randomUUID();
  const history = conversationStore.get(conversationId) ?? [];

  // Resolve auth user from token (silently fails if token is absent/expired)
  const authUser = decodeAuthToken(req.authToken);

  const ctx: ToolContext = {
    authToken: req.authToken,
    authUser,
    actions: [] as ChatAction[],
  };

  // Append the new user message
  history.push({ role: 'user', content: req.message });

  // Build the messages array for the API call (system + history)
  const apiMessages: ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...(history as ChatCompletionMessageParam[]),
  ];

  const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
  const client = getGroqClient();

  let assistantMessage = '';
  let roundsLeft = MAX_TOOL_CALL_ROUNDS;

  try {
    // ── Tool-calling loop ────────────────────────────────────────────────────
    while (roundsLeft-- > 0) {
      const response = await client.chat.completions.create({
        model,
        messages: apiMessages,
        tools: TOOL_DEFINITIONS,
        tool_choice: 'auto',
      });

      const choice = response.choices[0];
      if (!choice) break;

      const msg = choice.message;

      // Add assistant message to the running conversation
      apiMessages.push(msg as ChatCompletionMessageParam);

      // If no tool calls, we have the final text response
      if (!msg.tool_calls || msg.tool_calls.length === 0) {
        assistantMessage = msg.content ?? '';
        break;
      }

      // Process each tool call sequentially
      for (const toolCall of msg.tool_calls) {
        // Groq uses the standard 'function' tool call type
        if (toolCall.type !== 'function') continue;

        let parsedArgs: unknown = {};
        try {
          parsedArgs = JSON.parse(toolCall.function.arguments);
        } catch {
          parsedArgs = {};
        }

        const toolResult = await dispatchTool(toolCall.function.name, parsedArgs, ctx);

        // Append tool result message
        apiMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: toolResult,
        });
      }

      // If stop_reason is tool_calls, loop again to get the next response
      if (choice.finish_reason !== 'tool_calls') {
        assistantMessage = msg.content ?? '';
        break;
      }
    }

    if (!assistantMessage) {
      assistantMessage =
        'I was unable to generate a response. Please try again or use the Login or Book a Free Trial buttons.';
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error';
    // Log without revealing the API key
    if (process.env.NODE_ENV !== 'test') {
      console.error('[ChatService] Groq API error:', errMsg);
    }
    return {
      message:
        "I'm having trouble connecting right now. Please try again shortly, or use the **Login** or **Book a Free Trial** button.",
      conversationId,
      actions: ctx.actions,
    };
  }

  // Persist assistant response to history
  history.push({ role: 'assistant', content: assistantMessage });

  // Trim history to avoid unbounded growth
  const trimmed =
    history.length > MAX_HISTORY_MESSAGES ? history.slice(-MAX_HISTORY_MESSAGES) : history;

  conversationStore.set(conversationId, trimmed);

  return {
    message: assistantMessage,
    conversationId,
    actions: ctx.actions,
  };
}

/** Exposed for testing: clear a specific conversation */
export function clearConversation(conversationId: string): void {
  conversationStore.delete(conversationId);
}
