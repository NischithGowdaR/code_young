/**
 * ChatMessageList.tsx
 *
 * Renders the conversation message list with role-specific styling.
 * Supports markdown-style bold (**text**) and newlines.
 */

import React, { useEffect, useRef } from 'react';
import type { ChatMessage } from './useChat.js';

interface ChatMessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

function renderMarkdown(text: string): React.ReactNode[] {
  // Handle **bold** and newlines
  const parts = text.split(/(\*\*[^*]+\*\*|\n)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part === '\n') return <br key={i} />;
    return part;
  });
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({ messages, isLoading }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div
      id="chat-message-list"
      className="chatbot-message-list"
      role="log"
      aria-live="polite"
      aria-label="Conversation"
    >
      {messages.length === 0 && !isLoading && (
        <div className="chatbot-empty-state" aria-live="polite">
          <p>👋 Hi! I'm the CodeYoung AI assistant.</p>
          <p>Ask me about our courses or how to book a free trial class!</p>
        </div>
      )}

      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`chatbot-message chatbot-message--${msg.role}`}
          role="article"
          aria-label={`${msg.role === 'user' ? 'You' : 'Assistant'}: ${msg.content}`}
        >
          {msg.role === 'assistant' && (
            <div className="chatbot-avatar" aria-hidden="true">
              🤖
            </div>
          )}
          <div className="chatbot-bubble">{renderMarkdown(msg.content)}</div>
          {msg.role === 'user' && (
            <div className="chatbot-avatar chatbot-avatar--user" aria-hidden="true">
              👤
            </div>
          )}
        </div>
      ))}

      {isLoading && (
        <div
          className="chatbot-message chatbot-message--assistant"
          aria-label="Assistant is typing"
        >
          <div className="chatbot-avatar" aria-hidden="true">
            🤖
          </div>
          <div className="chatbot-bubble chatbot-bubble--loading" aria-live="polite">
            <span className="chatbot-dot" />
            <span className="chatbot-dot" />
            <span className="chatbot-dot" />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
