import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { VehicleCard } from './VehicleCard';
import { Vehicle } from '@/types/api';

function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: 'vehicle-1',
    make: 'Toyota',
    model: 'Camry',
    category: 'Sedan',
    price: 28500,
    quantity: 4,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function renderCard(vehicle: Vehicle) {
  return render(
    <MemoryRouter>
      <VehicleCard vehicle={vehicle} />
    </MemoryRouter>,
  );
}

describe('VehicleCard', () => {
  it('renders make, model, category, and formatted price', () => {
    renderCard(makeVehicle());

    expect(screen.getByText('Toyota Camry')).toBeInTheDocument();
    expect(screen.getByText('Sedan')).toBeInTheDocument();
    expect(screen.getByText('$28,500')).toBeInTheDocument();
  });

  it('shows the quantity when in stock', () => {
    renderCard(makeVehicle({ quantity: 7 }));

    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('shows "Sold out" instead of "0" when quantity is zero', () => {
    renderCard(makeVehicle({ quantity: 0 }));

    expect(screen.getByText('Sold out')).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('links to the vehicle detail page', () => {
    renderCard(makeVehicle({ id: 'abc-123' }));

    expect(screen.getByRole('link')).toHaveAttribute('href', '/vehicles/abc-123');
  });
});
