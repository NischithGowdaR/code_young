/**
 * useChat.ts
 *
 * Custom React hook for managing chatbot state.
 * Calls the backend /api/chat endpoint — never xAI directly.
 */

import { useState, useCallback, useRef } from 'react';
import { apiUrl } from '../../config/api.js';

export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    slots?: any[];
  };
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actions, setActions] = useState<ChatAction[]>([]);
  const conversationIdRef = useRef<string | undefined>(undefined);

  const sendMessage = useCallback(async (content: string, authToken?: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);
    setActions([]);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const body: Record<string, string> = { message: content.trim() };
      if (conversationIdRef.current) {
        body['conversationId'] = conversationIdRef.current;
      }

      const res = await fetch(apiUrl('/api/chat'), {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message ?? `Request failed with status ${res.status}`);
      }

      const data = await res.json();

      // Persist conversation ID for the session
      if (data.conversationId) {
        conversationIdRef.current = data.conversationId;
      }

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setActions(data.actions ?? []);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(message);

      // Append a friendly error message to the conversation
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content:
          "I'm having trouble connecting right now. Please try again or use the **Login** or **Book a Free Trial** button.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearActions = useCallback(() => {
    setActions([]);
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    setActions([]);
    conversationIdRef.current = undefined;
  }, []);

  return {
    messages,
    isLoading,
    error,
    actions,
    sendMessage,
    clearActions,
    clearChat,
    conversationId: conversationIdRef.current,
  };
}
