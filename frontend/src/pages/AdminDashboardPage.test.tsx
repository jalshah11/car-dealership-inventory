import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminDashboardPage } from './AdminDashboardPage';
import {
  useVehiclesQuery,
  useCreateVehicleMutation,
  useUpdateVehicleMutation,
  useDeleteVehicleMutation,
  useRestockVehicleMutation,
} from '@/hooks/useVehicles';

vi.mock('@/hooks/useVehicles');
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

describe('AdminDashboardPage', () => {
  const mockCreate = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();
  const mockRestock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useVehiclesQuery).mockReturnValue({
      data: [mockVehicle],
      isLoading: false,
    } as unknown as ReturnType<typeof useVehiclesQuery>);
    vi.mocked(useCreateVehicleMutation).mockReturnValue({
      mutate: mockCreate,
      isPending: false,
    } as unknown as ReturnType<typeof useCreateVehicleMutation>);
    vi.mocked(useUpdateVehicleMutation).mockReturnValue({
      mutate: mockUpdate,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateVehicleMutation>);
    vi.mocked(useDeleteVehicleMutation).mockReturnValue({
      mutate: mockDelete,
      isPending: false,
      variables: undefined,
    } as unknown as ReturnType<typeof useDeleteVehicleMutation>);
    vi.mocked(useRestockVehicleMutation).mockReturnValue({
      mutate: mockRestock,
      isPending: false,
      variables: undefined,
    } as unknown as ReturnType<typeof useRestockVehicleMutation>);
  });

  it('renders the vehicle table with existing inventory', () => {
    render(<AdminDashboardPage />);

    expect(screen.getByText('Toyota Camry')).toBeInTheDocument();
    expect(screen.getByText('$28,500')).toBeInTheDocument();
  });

  it('opens the create form and submits a new vehicle', async () => {
    const user = userEvent.setup();
    render(<AdminDashboardPage />);

    await user.click(screen.getByText('+ Add vehicle'));
    await user.type(screen.getByLabelText('Make'), 'Honda');
    await user.type(screen.getByLabelText('Model'), 'Civic');
    await user.type(screen.getByLabelText('Category'), 'Sedan');
    await user.type(screen.getByLabelText('Price'), '24000');
    await user.type(screen.getByLabelText('Quantity'), '5');
    await user.click(screen.getByRole('button', { name: 'Create vehicle' }));

    expect(mockCreate).toHaveBeenCalledWith(
      { make: 'Honda', model: 'Civic', category: 'Sedan', price: 24000, quantity: 5 },
      expect.any(Object),
    );
  });

  it('opens the edit form pre-filled with the vehicle data', async () => {
    const user = userEvent.setup();
    render(<AdminDashboardPage />);

    await user.click(screen.getByText('Edit'));

    expect(screen.getByDisplayValue('Toyota')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Camry')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
  });

  it('asks for confirmation before deleting, and deletes on confirm', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();
    render(<AdminDashboardPage />);

    await user.click(screen.getByText('Delete'));

    expect(window.confirm).toHaveBeenCalled();
    expect(mockDelete).toHaveBeenCalledWith('vehicle-1', expect.any(Object));
  });

  it('does NOT delete when the confirmation is cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const user = userEvent.setup();
    render(<AdminDashboardPage />);

    await user.click(screen.getByText('Delete'));

    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('restocks with the entered amount', async () => {
    const user = userEvent.setup();
    render(<AdminDashboardPage />);

    await user.type(screen.getByLabelText('Restock amount'), '10');
    await user.click(screen.getByRole('button', { name: 'Restock' }));

    expect(mockRestock).toHaveBeenCalledWith({ id: 'vehicle-1', amount: 10 }, expect.any(Object));
  });

  it('ignores a restock submission with a non-positive amount', async () => {
    const user = userEvent.setup();
    render(<AdminDashboardPage />);

    await user.type(screen.getByLabelText('Restock amount'), '0');
    await user.click(screen.getByRole('button', { name: 'Restock' }));

    expect(mockRestock).not.toHaveBeenCalled();
  });
});
