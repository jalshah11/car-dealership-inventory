import { signToken, verifyToken } from '@utils/jwt';
import { Role } from '@prisma/client';

describe('jwt utils', () => {
  const payload = { userId: 'abc-123', role: Role.USER };

  describe('signToken', () => {
    it('produces a non-empty string token', () => {
      const token = signToken(payload);
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
      // JWTs have 3 dot-separated segments: header.payload.signature
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('verifyToken', () => {
    it('decodes a valid token back to its original payload', () => {
      const token = signToken(payload);
      const decoded = verifyToken(token);

      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.role).toBe(payload.role);
    });

    it('throws when the token is malformed', () => {
      expect(() => verifyToken('not-a-real-token')).toThrow();
    });

    it('throws when the token was signed with a different secret', () => {
      // Simulates a forged/tampered token -- critical security property.
      const jwt = require('jsonwebtoken');
      const forged = jwt.sign(payload, 'wrong-secret');

      expect(() => verifyToken(forged)).toThrow();
    });
  });
});
