import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import toast from 'react-hot-toast';
import { VehicleDetailPage } from './VehicleDetailPage';
import { useVehicleQuery, usePurchaseVehicleMutation } from '@/hooks/useVehicles';
import { useAuth } from '@/hooks/useAuth';

vi.mock('@/hooks/useVehicles');
vi.mock('@/hooks/useAuth');
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const mockVehicle = {
  id: 'vehicle-1',
  make: 'Toyota',
  model: 'Camry',
  category: 'Sedan',
  price: 28500,
  quantity: 3,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/vehicles/vehicle-1']}>
      <Routes>
        <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
        <Route path="/login" element={<p>Login page</p>} />
        <Route path="/" element={<p>Home page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('VehicleDetailPage', () => {
  const mockMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePurchaseVehicleMutation).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as unknown as ReturnType<typeof usePurchaseVehicleMutation>);
  });

  it('shows an enabled Purchase button for an authenticated user when in stock', () => {
    vi.mocked(useVehicleQuery).mockReturnValue({
      data: mockVehicle,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useVehicleQuery>);
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', email: 'a@b.com', name: 'A', role: 'USER', createdAt: '', updatedAt: '' },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderPage();

    expect(screen.getByRole('button', { name: 'Purchase' })).toBeEnabled();
  });

  it('disables the button and shows "Out of stock" when quantity is 0', () => {
    vi.mocked(useVehicleQuery).mockReturnValue({
      data: { ...mockVehicle, quantity: 0 },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useVehicleQuery>);
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', email: 'a@b.com', name: 'A', role: 'USER', createdAt: '', updatedAt: '' },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderPage();

    expect(screen.getByRole('button', { name: 'Out of stock' })).toBeDisabled();
  });

  it('prompts an unauthenticated user to log in instead of showing a purchase button', () => {
    vi.mocked(useVehicleQuery).mockReturnValue({
      data: mockVehicle,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useVehicleQuery>);
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderPage();

    expect(screen.queryByRole('button', { name: 'Purchase' })).not.toBeInTheDocument();
    expect(screen.getByText('Log in')).toBeInTheDocument();
  });

  it('calls the purchase mutation when the button is clicked', async () => {
    vi.mocked(useVehicleQuery).mockReturnValue({
      data: mockVehicle,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useVehicleQuery>);
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', email: 'a@b.com', name: 'A', role: 'USER', createdAt: '', updatedAt: '' },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
    const user = userEvent.setup();

    renderPage();
    await user.click(screen.getByRole('button', { name: 'Purchase' }));

    expect(mockMutate).toHaveBeenCalledWith('vehicle-1', expect.any(Object));
  });

  it('shows a not-found message when the vehicle does not exist', async () => {
    vi.mocked(useVehicleQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as unknown as ReturnType<typeof useVehicleQuery>);
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Vehicle not found.')).toBeInTheDocument();
    });
  });
});
