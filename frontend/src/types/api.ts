// Types mirroring the backend's actual response shapes (see backend's
// src/models/user.model.ts and prisma/schema.prisma). Keeping these in one
// file gives every component/service a single source of truth for what
// the API returns, instead of each file guessing at the shape.

export type Role = 'USER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  category: string;
  price: number;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVehicleInput {
  make: string;
  model: string;
  category: string;
  price: number;
  quantity?: number;
}

export type UpdateVehicleInput = Partial<CreateVehicleInput>;

export interface SearchFilters {
  make?: string;
  model?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

// The backend's error middleware responds with this shape for both simple
// AppError failures ({ error: string }) and Zod validation failures
// ({ error: string, details: Record<string, string[]> }).
export interface ApiErrorResponse {
  error: string;
  details?: Record<string, string[]>;
}
