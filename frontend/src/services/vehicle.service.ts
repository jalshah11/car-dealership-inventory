import { apiClient } from './api-client';
import type { CreateVehicleInput, SearchFilters, UpdateVehicleInput, Vehicle } from '@/types/api';

export async function listVehicles(): Promise<Vehicle[]> {
  const { data } = await apiClient.get<Vehicle[]>('/vehicles');
  return data;
}

export async function searchVehicles(filters: SearchFilters): Promise<Vehicle[]> {
  // axios serializes the `params` object into a query string for us
  // (e.g. { make: 'Toyota', minPrice: 20000 } -> ?make=Toyota&minPrice=20000),
  // and drops any key whose value is undefined -- exactly what we want,
  // since an unset filter shouldn't send an empty ?make= to the backend.
  const { data } = await apiClient.get<Vehicle[]>('/vehicles/search', { params: filters });
  return data;
}

export async function getVehicle(id: string): Promise<Vehicle> {
  const { data } = await apiClient.get<Vehicle>(`/vehicles/${id}`);
  return data;
}

export async function createVehicle(input: CreateVehicleInput): Promise<Vehicle> {
  const { data } = await apiClient.post<Vehicle>('/vehicles', input);
  return data;
}

export async function updateVehicle(id: string, input: UpdateVehicleInput): Promise<Vehicle> {
  const { data } = await apiClient.put<Vehicle>(`/vehicles/${id}`, input);
  return data;
}

export async function deleteVehicle(id: string): Promise<void> {
  await apiClient.delete(`/vehicles/${id}`);
}

export async function purchaseVehicle(id: string): Promise<Vehicle> {
  const { data } = await apiClient.post<Vehicle>(`/vehicles/${id}/purchase`);
  return data;
}

export async function restockVehicle(id: string, amount: number): Promise<Vehicle> {
  const { data } = await apiClient.post<Vehicle>(`/vehicles/${id}/restock`, { amount });
  return data;
}
