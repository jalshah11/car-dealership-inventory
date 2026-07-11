import axios from 'axios';
import type { ApiErrorResponse } from '@/types/api';

// Centralizes "what do I actually show the user when a request fails" --
// without this, every form/component would need to know the shape of our
// backend's error responses AND handle network failures (no response at
// all, e.g. the API is down) separately, inconsistently.
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    // A validation error (400) includes field-level details -- surface the
    // first one, since it's usually the most actionable single message for
    // a toast. Forms that want per-field messages read response.data.details
    // directly instead of going through this helper.
    const details = error.response?.data?.details;
    if (details) {
      const firstField = Object.values(details)[0];
      if (firstField?.[0]) {
        return firstField[0];
      }
    }

    if (error.response?.data?.error) {
      return error.response.data.error;
    }

    if (error.response) {
      return `Request failed with status ${error.response.status}`;
    }

    // No response at all -- the request never reached the server (network
    // down, backend not running, CORS misconfiguration, etc.)
    return 'Unable to reach the server. Please check your connection and try again.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}
