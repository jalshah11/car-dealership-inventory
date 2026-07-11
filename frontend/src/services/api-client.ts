// Central axios instance. Every service file imports THIS, never axios
// directly -- that's what lets us configure the base URL and auth header
// injection in exactly one place.

import axios from 'axios';

export const TOKEN_STORAGE_KEY = 'car_dealership_token';

export const apiClient = axios.create({
  // Same-origin '/api' -- Vite's dev server proxy (see vite.config.ts)
  // forwards this to the real backend on :4000, so we never hardcode a
  // backend URL here, and CORS never becomes a concern.
  baseURL: '/api',
});

// Attach the JWT (if we have one) to every outgoing request. Using an
// interceptor here -- rather than manually adding the header in every
// service call -- means a developer adding a new endpoint later can't
// forget it.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// NOTE ON localStorage FOR THE TOKEN:
// Storing a JWT in localStorage is simple and works for this project, but
// it's readable by any JavaScript running on the page -- meaning a
// successful XSS attack could steal it. The more defense-in-depth approach
// is an httpOnly cookie set BY THE SERVER, which client-side JS can never
// read at all. We're using localStorage here deliberately for simplicity
// (no backend cookie/session infrastructure needed), but this trade-off
// is worth being able to name explicitly in an interview.
