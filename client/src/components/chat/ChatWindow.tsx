/**
 * ChatWindow.tsx
 *
 * The visible chat panel: header, message list, quick actions, and input.
 * Handles action processing (navigation, open courses etc.).
 */

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatMessageList } from './ChatMessageList.js';
import { ChatInput } from './ChatInput.js';
import { ChatQuickActions } from './ChatQuickActions.js';
import { useAuth } from '../../context/AuthContext.js';
import type { ChatMessage, ChatAction } from './useChat.js';

interface ChatWindowProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  actions: ChatAction[];
  onSend: (message: string) => void;
  onClose: () => void;
  onClearActions?: () => void;
  authToken?: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  isLoading,
  error,
  actions,
  onSend,
  onClose,
  onClearActions,
  authToken: _authToken,
}) => {
  const navigate = useNavigate();
  const { setAuthSession, logout } = useAuth();
  const showQuickActions = messages.length === 0 && !isLoading;

  // Process frontend actions from the last assistant response
  const processedActionsRef = React.useRef<Set<string>>(new Set());

  const processActions = useCallback(
    (actionList: ChatAction[]) => {
      for (const action of actionList) {
        const key = `${action.type}-${action.payload?.url || ''}-${action.payload?.token || ''}`;
        if (processedActionsRef.current.has(key)) continue;
        processedActionsRef.current.add(key);

        switch (action.type) {
          case 'NAVIGATE':
            if (action.payload?.url) {
              if (action.payload.url.includes('#')) {
                const [path, hash] = action.payload.url.split('#');
                navigate(path || '/');
                setTimeout(() => {
                  const el = document.getElementById(hash);
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 150);
              } else {
                navigate(action.payload.url);
              }
            }
            break;
          case 'OPEN_LOGIN':
            navigate('/login');
            break;
          case 'OPEN_BOOKING':
            navigate('/dashboard/book-trial');
            break;
          case 'OPEN_COURSES':
            navigate('/');
            setTimeout(() => {
              const el = document.getElementById('courses');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 150);
            break;
          case 'LOGIN_SUCCESS':
            if (action.payload?.token && action.payload?.user) {
              setAuthSession(
                action.payload.user,
                action.payload.token,
                action.payload.refreshToken
              );
              const targetUrl =
                action.payload.url ||
                (action.payload.user.role === 'ADMIN' ? '/admin' : '/dashboard');
              navigate(targetUrl);
            }
            break;
          case 'LOGOUT_SUCCESS':
            logout().catch(() => {});
            navigate('/login');
            break;
          default:
            break;
        }
      }
    },
    [navigate, setAuthSession, logout]
  );

  // Process actions whenever they change
  React.useEffect(() => {
    if (actions.length > 0) {
      processActions(actions);
      onClearActions?.();
    }
  }, [actions, processActions, onClearActions]);

  return (
    <div
      id="chatbot-window"
      className="chatbot-window"
      role="dialog"
      aria-modal="true"
      aria-label="CodeYoung AI Assistant"
    >
      {/* Header */}
      <div className="chatbot-header">
        <div className="chatbot-header-info">
          <div className="chatbot-header-avatar" aria-hidden="true">
            🤖
          </div>
          <div>
            <p className="chatbot-header-title">CodeYoung AI</p>
            <p className="chatbot-header-subtitle">
              {isLoading ? 'Typing…' : 'Online · Ask me anything'}
            </p>
          </div>
        </div>
        <button
          id="chatbot-close-button"
          className="chatbot-close-btn"
          onClick={onClose}
          aria-label="Close chat"
          title="Close (Esc)"
        >
          ✕
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="chatbot-error-banner" role="alert" aria-live="assertive">
          ⚠️ {error}
        </div>
      )}

      {/* Message list */}
      <ChatMessageList messages={messages} isLoading={isLoading} />

      {/* Quick actions (shown only when conversation is empty) */}
      <ChatQuickActions onSelect={onSend} visible={showQuickActions} />

      {/* Input */}
      <ChatInput onSend={onSend} isLoading={isLoading} />
    </div>
  );
};
