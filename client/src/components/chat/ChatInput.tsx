/**
 * ChatInput.tsx
 *
 * Text input bar for typing and submitting messages.
 * Supports Enter key to send and Shift+Enter for newline.
 */

import React, { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading, disabled = false }) => {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading || disabled) return;
    onSend(trimmed);
    setValue('');
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  };

  return (
    <div className="chatbot-input-bar" role="form" aria-label="Message input">
      <textarea
        id="chat-input-textarea"
        ref={textareaRef}
        className="chatbot-input-textarea"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          handleInput();
        }}
        onKeyDown={handleKeyDown}
        placeholder="Type a message…"
        rows={1}
        aria-label="Type your message"
        aria-multiline="true"
        disabled={isLoading || disabled}
        maxLength={2000}
      />
      <button
        id="chat-send-button"
        type="button"
        className="chatbot-send-btn"
        onClick={handleSend}
        disabled={isLoading || disabled || !value.trim()}
        aria-label="Send message"
        title="Send message (Enter)"
      >
        {isLoading ? (
          <span className="chatbot-send-spinner" aria-hidden="true" />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            width="18"
            height="18"
          >
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        )}
      </button>
    </div>
  );
};
