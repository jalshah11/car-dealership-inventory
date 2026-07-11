import { useState } from 'react';
import type { SearchFilters as SearchFiltersType } from '@/types/api';
import { useVehiclesQuery } from '@/hooks/useVehicles';
import { SearchFilters } from '@/components/SearchFilters';
import { VehicleCard } from '@/components/VehicleCard';
import { PageLoadingState } from '@/components/Spinner';

export function DashboardPage() {
  const [filters, setFilters] = useState<SearchFiltersType>({});
  const { data: vehicles, isLoading, isError } = useVehiclesQuery(filters);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-navy">Browse inventory</h1>

      <SearchFilters onSearch={setFilters} />

      {isLoading && <PageLoadingState />}

      {isError && (
        <p className="rounded-md border border-danger bg-white p-4 text-danger">
          Couldn't load vehicles. Please try again.
        </p>
      )}

      {vehicles && vehicles.length === 0 && (
        <p className="rounded-md border border-border bg-white p-8 text-center text-ink-soft">
          No vehicles match your search. Try adjusting the filters.
        </p>
      )}

      {vehicles && vehicles.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      )}
    </div>
  );
}
