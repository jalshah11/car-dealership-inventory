import { registerSchema, loginSchema } from '@validators/auth.validator';

describe('registerSchema', () => {
  it('accepts a valid registration payload', () => {
    const result = registerSchema.safeParse({
      email: 'jane@example.com',
      password: 'SecurePass123!',
      name: 'Jane Doe',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = registerSchema.safeParse({
      email: 'not-an-email',
      password: 'SecurePass123!',
      name: 'Jane Doe',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({
      email: 'jane@example.com',
      password: 'short',
      name: 'Jane Doe',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a missing name', () => {
    const result = registerSchema.safeParse({
      email: 'jane@example.com',
      password: 'SecurePass123!',
    });
    expect(result.success).toBe(false);
  });

  it('silently ignores an attempt to set role in the payload', () => {
    // Security-relevant test: even if a malicious client sends role: "ADMIN"
    // in the request body, our schema should not expose a `role` field at
    // all, so privilege escalation via registration is impossible by design.
    const result = registerSchema.safeParse({
      email: 'jane@example.com',
      password: 'SecurePass123!',
      name: 'Jane Doe',
      role: 'ADMIN',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).role).toBeUndefined();
    }
  });
});

describe('loginSchema', () => {
  it('accepts a valid login payload', () => {
    const result = loginSchema.safeParse({
      email: 'jane@example.com',
      password: 'anything',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a missing password', () => {
    const result = loginSchema.safeParse({ email: 'jane@example.com' });
    expect(result.success).toBe(false);
  });
});
