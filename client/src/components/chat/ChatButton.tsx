/**
 * ChatButton.tsx
 *
 * Fixed floating button that opens the chatbot widget.
 */

import React from 'react';

interface ChatButtonProps {
  onClick: () => void;
  hasNewMessage?: boolean;
}

export const ChatButton: React.FC<ChatButtonProps> = ({ onClick, hasNewMessage = false }) => {
  return (
    <button
      id="chatbot-open-button"
      onClick={onClick}
      aria-label="Open CodeYoung AI Assistant"
      title="Chat with CodeYoung AI"
      className="chatbot-fab"
    >
      {/* Robot / chat icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="chatbot-fab-icon"
      >
        {/* Robot head */}
        <rect x="3" y="8" width="18" height="12" rx="3" ry="3" />
        {/* Eyes */}
        <circle cx="9" cy="13" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="15" cy="13" r="1.5" fill="currentColor" stroke="none" />
        {/* Antenna */}
        <line x1="12" y1="8" x2="12" y2="4" />
        <circle cx="12" cy="3.5" r="1" fill="currentColor" stroke="none" />
        {/* Mouth */}
        <path d="M9 17 Q12 19 15 17" strokeWidth="1.5" />
      </svg>

      {/* Notification dot */}
      {hasNewMessage && <span className="chatbot-fab-dot" aria-hidden="true" />}
    </button>
  );
};
