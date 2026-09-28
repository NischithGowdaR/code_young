/**
 * ChatQuickActions.tsx
 *
 * Quick action chips shown at the start of the conversation.
 */

import React from 'react';

export interface QuickAction {
  id: string;
  label: string;
  message: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'qa-courses', label: '📚 Explore courses', message: 'Tell me about your courses' },
  { id: 'qa-trial', label: '🎓 What is a trial class?', message: 'What is a trial class?' },
  { id: 'qa-book', label: '📅 Book a trial class', message: 'I want to book a trial class' },
  { id: 'qa-login', label: '🔑 Go to login', message: 'How do I log in?' },
];

interface ChatQuickActionsProps {
  onSelect: (message: string) => void;
  visible: boolean;
}

export const ChatQuickActions: React.FC<ChatQuickActionsProps> = ({ onSelect, visible }) => {
  if (!visible) return null;

  return (
    <div
      className="chatbot-quick-actions"
      role="group"
      aria-label="Quick action suggestions"
      id="chat-quick-actions"
    >
      {QUICK_ACTIONS.map((qa) => (
        <button
          key={qa.id}
          id={qa.id}
          className="chatbot-quick-action-btn"
          onClick={() => onSelect(qa.message)}
          type="button"
          aria-label={qa.label}
        >
          {qa.label}
        </button>
      ))}
    </div>
  );
};
