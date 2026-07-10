import { hashPassword, comparePassword } from '@utils/password';

describe('password utils', () => {
  describe('hashPassword', () => {
    it('returns a hash different from the original plaintext password', async () => {
      const plain = 'MySecurePass123!';
      const hash = await hashPassword(plain);

      expect(hash).not.toBe(plain);
      // bcrypt hashes always start with a version identifier like $2b$
      expect(hash).toMatch(/^\$2[aby]\$/);
    });

    it('produces a different hash each time (due to random salt)', async () => {
      const plain = 'MySecurePass123!';
      const hash1 = await hashPassword(plain);
      const hash2 = await hashPassword(plain);

      // If salts were reused, identical passwords would produce identical
      // hashes -- which would let an attacker spot users who share a
      // password just by comparing hash columns. Random salts prevent this.
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('returns true when the plaintext matches the hash', async () => {
      const plain = 'MySecurePass123!';
      const hash = await hashPassword(plain);

      await expect(comparePassword(plain, hash)).resolves.toBe(true);
    });

    it('returns false when the plaintext does not match the hash', async () => {
      const hash = await hashPassword('MySecurePass123!');

      await expect(comparePassword('WrongPassword', hash)).resolves.toBe(false);
    });
  });
});
