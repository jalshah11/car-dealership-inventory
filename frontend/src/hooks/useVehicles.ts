import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as vehicleService from '@/services/vehicle.service';
import { CreateVehicleInput, SearchFilters, UpdateVehicleInput } from '@/types/api';

// A shared query key prefix -- every vehicle-related query is invalidated
// together after a mutation (create/update/delete/purchase/restock), so the
// list view always reflects the latest state without a manual refetch call
// scattered through every mutation's onSuccess.
const VEHICLES_KEY = ['vehicles'] as const;

export function useVehiclesQuery(filters: SearchFilters) {
  const hasFilters = Object.keys(filters).length > 0;

  return useQuery({
    // Filters are part of the query key -- React Query treats
    // { make: 'Toyota' } and { make: 'Honda' } as separate cache entries
    // automatically, which is exactly the caching behavior we want (switch
    // filters and back, get the cached result instantly).
    queryKey: [...VEHICLES_KEY, filters],
    queryFn: () => (hasFilters ? vehicleService.searchVehicles(filters) : vehicleService.listVehicles()),
  });
}

export function useVehicleQuery(id: string) {
  return useQuery({
    queryKey: [...VEHICLES_KEY, id],
    queryFn: () => vehicleService.getVehicle(id),
  });
}

export function useCreateVehicleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateVehicleInput) => vehicleService.createVehicle(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: VEHICLES_KEY }),
  });
}

export function useUpdateVehicleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateVehicleInput }) =>
      vehicleService.updateVehicle(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: VEHICLES_KEY }),
  });
}

export function useDeleteVehicleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vehicleService.deleteVehicle(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: VEHICLES_KEY }),
  });
}

export function usePurchaseVehicleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vehicleService.purchaseVehicle(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: VEHICLES_KEY }),
  });
}

export function useRestockVehicleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      vehicleService.restockVehicle(id, amount),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: VEHICLES_KEY }),
  });
}
