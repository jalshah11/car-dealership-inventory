import { describe, it, expect } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import { getErrorMessage } from './get-error-message';

function makeAxiosError(status: number, data: unknown): AxiosError {
  const error = new AxiosError('Request failed', String(status));
  error.response = {
    status,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data,
  };
  return error;
}

describe('getErrorMessage', () => {
  it('extracts the first field error from a validation failure', () => {
    const error = makeAxiosError(400, {
      error: 'Validation failed',
      details: { email: ['Invalid email'], password: ['Too short'] },
    });

    expect(getErrorMessage(error)).toBe('Invalid email');
  });

  it('extracts the plain error message from an AppError response', () => {
    const error = makeAxiosError(409, { error: 'Email already registered' });

    expect(getErrorMessage(error)).toBe('Email already registered');
  });

  it('falls back to a generic message when the response has no error field', () => {
    const error = makeAxiosError(500, {});

    expect(getErrorMessage(error)).toBe('Request failed with status 500');
  });

  it('returns a network-specific message when there is no response at all', () => {
    const error = new AxiosError('Network Error');
    // No .response set -- simulates the request never reaching the server.

    expect(getErrorMessage(error)).toMatch(/unable to reach the server/i);
  });

  it('falls back to the message for a plain JS Error', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('falls back to a generic message for a completely unknown thrown value', () => {
    expect(getErrorMessage('a string, not even an Error')).toBe(
      'Something went wrong. Please try again.',
    );
  });
});
