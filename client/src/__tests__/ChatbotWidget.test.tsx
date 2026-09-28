/**
 * ChatbotWidget.test.tsx
 *
 * Frontend tests for the chatbot widget:
 * - Robot icon appears
 * - Clicking the robot opens the chatbot
 * - Close button closes it
 * - User can send a message
 * - Loading state appears
 * - Error state appears
 * - Quick actions appear
 * - Login action navigates to /login
 * - Booking action navigates to /dashboard/book-trial
 * - Keyboard accessibility (Escape key)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
import { ChatbotWidget } from '../components/chat/ChatbotWidget.js';
import { ChatButton } from '../components/chat/ChatButton.js';
import { ChatQuickActions } from '../components/chat/ChatQuickActions.js';
import { ChatInput } from '../components/chat/ChatInput.js';
import { ChatMessageList } from '../components/chat/ChatMessageList.js';

// Mock scrollIntoView (not implemented in jsdom)
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock AuthContext
vi.mock('../context/AuthContext.js', () => ({
  useAuth: vi.fn(() => ({ accessToken: null, user: null })),
}));

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper to create a successful chat response
function makeChatResponse(overrides = {}) {
  return {
    ok: true,
    json: async () => ({
      message: 'Hello from the assistant!',
      conversationId: '550e8400-e29b-41d4-a716-446655440000',
      actions: [],
      ...overrides,
    }),
  };
}

function renderWidget() {
  return render(
    <BrowserRouter>
      <ChatbotWidget />
    </BrowserRouter>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ChatButton', () => {
  it('renders the robot chat icon button', () => {
    render(<ChatButton onClick={vi.fn()} />);
    const btn = screen.getByRole('button', { name: /open codeyoung ai assistant/i });
    expect(btn).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<ChatButton onClick={handleClick} />);
    await user.click(screen.getByRole('button', { name: /open codeyoung ai assistant/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows notification dot when hasNewMessage is true', () => {
    const { container } = render(<ChatButton onClick={vi.fn()} hasNewMessage={true} />);
    const dot = container.querySelector('.chatbot-fab-dot');
    expect(dot).toBeInTheDocument();
  });

  it('does not show notification dot by default', () => {
    const { container } = render(<ChatButton onClick={vi.fn()} />);
    const dot = container.querySelector('.chatbot-fab-dot');
    expect(dot).not.toBeInTheDocument();
  });
});

describe('ChatQuickActions', () => {
  it('renders all four quick action buttons when visible', () => {
    render(<ChatQuickActions onSelect={vi.fn()} visible={true} />);
    expect(screen.getByText(/explore courses/i)).toBeInTheDocument();
    expect(screen.getByText(/what is a trial class/i)).toBeInTheDocument();
    expect(screen.getByText(/book a trial class/i)).toBeInTheDocument();
    expect(screen.getByText(/go to login/i)).toBeInTheDocument();
  });

  it('renders nothing when visible is false', () => {
    const { container } = render(<ChatQuickActions onSelect={vi.fn()} visible={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('calls onSelect with the correct message when a quick action is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ChatQuickActions onSelect={onSelect} visible={true} />);
    await user.click(screen.getByText(/explore courses/i));
    expect(onSelect).toHaveBeenCalledWith('Tell me about your courses');
  });

  it('calls onSelect with booking message when book button clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ChatQuickActions onSelect={onSelect} visible={true} />);
    await user.click(screen.getByText(/book a trial/i));
    expect(onSelect).toHaveBeenCalledWith('I want to book a trial class');
  });
});

describe('ChatInput', () => {
  it('renders the textarea and send button', () => {
    render(<ChatInput onSend={vi.fn()} isLoading={false} />);
    expect(screen.getByRole('textbox', { name: /type your message/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
  });

  it('send button is disabled when input is empty', () => {
    render(<ChatInput onSend={vi.fn()} isLoading={false} />);
    expect(screen.getByRole('button', { name: /send message/i })).toBeDisabled();
  });

  it('calls onSend with the typed message on send button click', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} isLoading={false} />);
    const textarea = screen.getByRole('textbox', { name: /type your message/i });
    await user.type(textarea, 'Hello world');
    await user.click(screen.getByRole('button', { name: /send message/i }));
    expect(onSend).toHaveBeenCalledWith('Hello world');
  });

  it('sends message on Enter key press', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} isLoading={false} />);
    const textarea = screen.getByRole('textbox', { name: /type your message/i });
    await user.type(textarea, 'Test message{Enter}');
    expect(onSend).toHaveBeenCalledWith('Test message');
  });

  it('is disabled when isLoading is true', () => {
    render(<ChatInput onSend={vi.fn()} isLoading={true} />);
    expect(screen.getByRole('textbox', { name: /type your message/i })).toBeDisabled();
  });
});

describe('ChatMessageList', () => {
  it('shows empty state when no messages', () => {
    render(<ChatMessageList messages={[]} isLoading={false} />);
    expect(screen.getByText(/hi! i'm the codeyoung ai assistant/i)).toBeInTheDocument();
  });

  it('shows user and assistant messages', () => {
    const messages = [
      { id: '1', role: 'user' as const, content: 'Hello!', timestamp: new Date() },
      { id: '2', role: 'assistant' as const, content: 'Hi there!', timestamp: new Date() },
    ];
    render(<ChatMessageList messages={messages} isLoading={false} />);
    expect(screen.getByText('Hello!')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('shows loading dots when isLoading is true', () => {
    const { container } = render(<ChatMessageList messages={[]} isLoading={true} />);
    const dots = container.querySelectorAll('.chatbot-dot');
    expect(dots.length).toBe(3);
  });
});

describe('ChatbotWidget integration', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('shows the robot chat button initially (not the window)', () => {
    renderWidget();
    expect(
      screen.getByRole('button', { name: /open codeyoung ai assistant/i })
    ).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the chat window when the robot button is clicked', async () => {
    const user = userEvent.setup();
    renderWidget();
    await user.click(screen.getByRole('button', { name: /open codeyoung ai assistant/i }));
    expect(screen.getByRole('dialog', { name: /codeyoung ai assistant/i })).toBeInTheDocument();
  });

  it('shows quick actions when chat is first opened', async () => {
    const user = userEvent.setup();
    renderWidget();
    await user.click(screen.getByRole('button', { name: /open codeyoung ai assistant/i }));
    expect(screen.getByText(/explore courses/i)).toBeInTheDocument();
  });

  it('closes the chat window when close button is clicked', async () => {
    const user = userEvent.setup();
    renderWidget();
    await user.click(screen.getByRole('button', { name: /open codeyoung ai assistant/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /close chat/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes the chat window when Escape is pressed', async () => {
    const user = userEvent.setup();
    renderWidget();
    await user.click(screen.getByRole('button', { name: /open codeyoung ai assistant/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows loading state when a message is sent', async () => {
    const user = userEvent.setup();
    // Delay the response to capture the loading state
    mockFetch.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(makeChatResponse()), 200))
    );

    renderWidget();
    await user.click(screen.getByRole('button', { name: /open codeyoung ai assistant/i }));

    const textarea = screen.getByRole('textbox', { name: /type your message/i });
    await user.type(textarea, 'What courses do you have?');
    await user.click(screen.getByRole('button', { name: /send message/i }));

    // Loading dots should appear
    await waitFor(() => {
      const dots = document.querySelectorAll('.chatbot-dot');
      expect(dots.length).toBeGreaterThan(0);
    });
  });

  it('shows the assistant response after send', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce(
      makeChatResponse({ message: 'We offer Math, Coding, English, and Science!' })
    );

    renderWidget();
    await user.click(screen.getByRole('button', { name: /open codeyoung ai assistant/i }));

    const textarea = screen.getByRole('textbox', { name: /type your message/i });
    await user.type(textarea, 'Tell me about courses');
    await user.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(screen.getByText(/we offer math, coding, english, and science/i)).toBeInTheDocument();
    });
  });

  it('shows error state on fetch failure', async () => {
    const user = userEvent.setup();
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    renderWidget();
    await user.click(screen.getByRole('button', { name: /open codeyoung ai assistant/i }));

    const textarea = screen.getByRole('textbox', { name: /type your message/i });
    await user.type(textarea, 'Hello');
    await user.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(screen.getByText(/trouble connecting/i)).toBeInTheDocument();
    });
  });

  it('navigates to /login when login action is received', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce(
      makeChatResponse({
        message: 'Please log in first.',
        actions: [{ type: 'NAVIGATE', payload: { url: '/login' } }],
      })
    );

    // We need a router with routes to test navigation
    const LoginPage = () => <div>Login Page</div>;
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<ChatbotWidget />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: /open codeyoung ai assistant/i }));
    const textarea = screen.getByRole('textbox', { name: /type your message/i });
    await user.type(textarea, 'I want to book a class');
    await user.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(screen.getByText(/login page/i)).toBeInTheDocument();
    });
  });

  it('navigates to /dashboard/book-trial when booking action received', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce(
      makeChatResponse({
        message: 'Taking you to the booking page!',
        actions: [{ type: 'NAVIGATE', payload: { url: '/dashboard/book-trial' } }],
      })
    );

    const BookTrialPage = () => <div>Book Trial Page</div>;
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<ChatbotWidget />} />
          <Route path="/dashboard/book-trial" element={<BookTrialPage />} />
        </Routes>
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: /open codeyoung ai assistant/i }));
    const textarea = screen.getByRole('textbox', { name: /type your message/i });
    await user.type(textarea, 'Book me a trial class please');
    await user.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(screen.getByText(/book trial page/i)).toBeInTheDocument();
    });
  });
});
