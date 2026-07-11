import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from './AuthContext';
import { useAuth } from '@/hooks/useAuth';
import * as authService from '@/services/auth.service';
import { TOKEN_STORAGE_KEY } from '@/services/api-client';

vi.mock('@/services/auth.service');

const mockUser = {
  id: 'user-1',
  email: 'jane@example.com',
  name: 'Jane Doe',
  role: 'USER' as const,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

// A minimal component that exercises the hook -- this is the standard
// pattern for testing a context/hook: render something real that USES it,
// rather than trying to test the hook in isolation outside of React.
function TestConsumer() {
  const { user, isAuthenticated, login, logout } = useAuth();
  return (
    <div>
      <p data-testid="status">{isAuthenticated ? `Logged in as ${user?.name}` : 'Logged out'}</p>
      <button onClick={() => login('jane@example.com', 'password123')}>Log in</button>
      <button onClick={logout}>Log out</button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>,
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('starts logged out when there is no stored session', async () => {
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('Logged out');
    });
  });

  it('restores a previous session from localStorage on mount', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'stored-token');
    localStorage.setItem('car_dealership_user', JSON.stringify(mockUser));

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('Logged in as Jane Doe');
    });
  });

  it('logging in stores the token and user, and updates state', async () => {
    vi.mocked(authService.login).mockResolvedValue({ user: mockUser, token: 'new-token' });
    const user = userEvent.setup();
    renderWithProvider();

    await user.click(screen.getByText('Log in'));

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('Logged in as Jane Doe');
    });
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe('new-token');
  });

  it('logging out clears storage and state', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'stored-token');
    localStorage.setItem('car_dealership_user', JSON.stringify(mockUser));
    const user = userEvent.setup();
    renderWithProvider();
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('Jane Doe'));

    await user.click(screen.getByText('Log out'));

    expect(screen.getByTestId('status')).toHaveTextContent('Logged out');
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });

  it('treats corrupted localStorage data as logged out rather than crashing', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'stored-token');
    localStorage.setItem('car_dealership_user', 'not valid json{{{');

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('Logged out');
    });
  });
});
