import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute, AdminRoute } from './RouteGuards';
import { useAuth } from '@/hooks/useAuth';

vi.mock('@/hooks/useAuth');

function renderProtected() {
  return render(
    <MemoryRouter initialEntries={['/secret']}>
      <Routes>
        <Route path="/login" element={<p>Login page</p>} />
        <Route path="/" element={<p>Home page</p>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/secret" element={<p>Secret content</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

function renderAdmin() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="/login" element={<p>Login page</p>} />
        <Route path="/" element={<p>Home page</p>} />
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<p>Admin content</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  it('shows a loading state while auth status is still being determined', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderProtected();

    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderProtected();

    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('renders the protected content when authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', email: 'a@b.com', name: 'A', role: 'USER', createdAt: '', updatedAt: '' },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderProtected();

    expect(screen.getByText('Secret content')).toBeInTheDocument();
  });
});

describe('AdminRoute', () => {
  it('redirects a logged-in but non-admin user to home', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', email: 'a@b.com', name: 'A', role: 'USER', createdAt: '', updatedAt: '' },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderAdmin();

    expect(screen.getByText('Home page')).toBeInTheDocument();
  });

  it('renders admin content for an admin user', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', email: 'a@b.com', name: 'A', role: 'ADMIN', createdAt: '', updatedAt: '' },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderAdmin();

    expect(screen.getByText('Admin content')).toBeInTheDocument();
  });

  it('redirects an unauthenticated user to login, not home', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderAdmin();

    expect(screen.getByText('Login page')).toBeInTheDocument();
  });
});
