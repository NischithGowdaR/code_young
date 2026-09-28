/**
 * ChatbotWidget.tsx
 *
 * Root chatbot widget: manages open/close state, keyboard dismissal,
 * and connects the ChatButton + ChatWindow components.
 *
 * Placed fixed at bottom-right. Visible on all pages via App.tsx.
 * XAI_API_KEY is NEVER imported or used here.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ChatButton } from './ChatButton.js';
import { ChatWindow } from './ChatWindow.js';
import { useChat } from './useChat.js';
import { useAuth } from '../../context/AuthContext.js';
import './chatbot.css';

export const ChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const { messages, isLoading, error, actions, sendMessage, clearActions } = useChat();
  const { accessToken } = useAuth();

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setHasNewMessage(false);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Keyboard: Escape closes the chat
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, handleClose]);

  // Show notification dot when a new assistant message arrives and widget is closed
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === 'assistant' && !isOpen) {
      setHasNewMessage(true);
    }
  }, [messages, isOpen]);

  const handleSend = useCallback(
    (message: string) => {
      // Pass the auth token to the hook (it sends it as a Bearer header)
      sendMessage(message, accessToken ?? undefined);
    },
    [sendMessage, accessToken]
  );

  return (
    <div className="chatbot-root" id="chatbot-widget">
      {/* Chat panel */}
      {isOpen && (
        <ChatWindow
          messages={messages}
          isLoading={isLoading}
          error={error}
          actions={actions}
          onSend={handleSend}
          onClose={handleClose}
          onClearActions={clearActions}
          authToken={accessToken ?? undefined}
        />
      )}

      {/* Floating button */}
      {!isOpen && <ChatButton onClick={handleOpen} hasNewMessage={hasNewMessage} />}
    </div>
  );
};
