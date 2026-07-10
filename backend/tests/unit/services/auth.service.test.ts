import { AuthService } from '@services/auth.service';
import { UserRepository } from '@repositories/user.repository';
import { hashPassword } from '@utils/password';
import { Role } from '@prisma/client';

// We mock the ENTIRE repository module. This is the key TDD/testing-pyramid
// idea: AuthService's business logic (is this email taken? hash the
// password; never leak it back out) should be verifiable in milliseconds,
// with zero database, zero network. If this test needed a real Postgres
// instance, it would be slow, flaky in CI, and would blur "did my BUSINESS
// LOGIC break" with "is the database reachable".
jest.mock('@repositories/user.repository');

const MockedUserRepository = UserRepository as jest.MockedClass<typeof UserRepository>;

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    MockedUserRepository.mockClear();
    mockUserRepository = new MockedUserRepository() as jest.Mocked<UserRepository>;
    authService = new AuthService(mockUserRepository);
  });

  describe('register', () => {
    const registerInput = {
      email: 'jane@example.com',
      password: 'SecurePass123!',
      name: 'Jane Doe',
    };

    it('throws a Conflict-style error if the email is already registered', async () => {
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 'existing-id',
        email: registerInput.email,
        password: 'irrelevant-hash',
        name: 'Existing User',
        role: Role.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(authService.register(registerInput)).rejects.toMatchObject({
        statusCode: 409,
      });

      // The service must short-circuit BEFORE attempting to create a
      // duplicate user -- this assertion catches a bug where we validate
      // the email but then create the user anyway.
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('hashes the password before persisting the user (never stores plaintext)', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockImplementation(async (data) => ({
        id: 'new-id',
        email: data.email,
        password: data.password,
        name: data.name,
        role: Role.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await authService.register(registerInput);

      const createArg = mockUserRepository.create.mock.calls[0][0];
      expect(createArg.password).not.toBe(registerInput.password);
      // A bcrypt hash always starts with a version tag like $2b$
      expect(createArg.password).toMatch(/^\$2[aby]\$/);
    });

    it('always creates the new user with role USER, regardless of input', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockImplementation(async (data) => ({
        id: 'new-id',
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role ?? Role.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await authService.register(registerInput);

      const createArg = mockUserRepository.create.mock.calls[0][0];
      expect(createArg.role).toBe(Role.USER);
    });

    it('returns the created user WITHOUT the password hash', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue({
        id: 'new-id',
        email: registerInput.email,
        password: 'some-hash',
        name: registerInput.name,
        role: Role.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await authService.register(registerInput);

      expect(result.user).not.toHaveProperty('password');
      expect(result.user.email).toBe(registerInput.email);
    });

    it('returns a signed JWT alongside the created user', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue({
        id: 'new-id',
        email: registerInput.email,
        password: 'some-hash',
        name: registerInput.name,
        role: Role.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await authService.register(registerInput);

      expect(typeof result.token).toBe('string');
      expect(result.token.split('.')).toHaveLength(3);
    });
  });

  describe('login', () => {
    const loginInput = { email: 'jane@example.com', password: 'SecurePass123!' };

    it('throws an Unauthorized-style error if the email does not exist', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(authService.login(loginInput)).rejects.toMatchObject({
        statusCode: 401,
      });
    });

    it('throws an Unauthorized-style error if the password is wrong', async () => {
      const correctHash = await hashPassword('TheRealPassword1!');
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 'existing-id',
        email: loginInput.email,
        password: correctHash,
        name: 'Jane Doe',
        role: Role.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(authService.login(loginInput)).rejects.toMatchObject({
        statusCode: 401,
      });
    });

    it('gives the SAME error for "no such user" and "wrong password"', async () => {
      // Security-relevant: if these errors differed (e.g. "user not found"
      // vs "wrong password"), an attacker could enumerate which emails are
      // registered just by watching the error message. Both cases must be
      // indistinguishable from the outside.
      mockUserRepository.findByEmail.mockResolvedValue(null);
      let noSuchUserMessage = '';
      try {
        await authService.login(loginInput);
      } catch (err) {
        noSuchUserMessage = (err as Error).message;
      }

      const correctHash = await hashPassword('TheRealPassword1!');
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 'existing-id',
        email: loginInput.email,
        password: correctHash,
        name: 'Jane Doe',
        role: Role.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      let wrongPasswordMessage = '';
      try {
        await authService.login(loginInput);
      } catch (err) {
        wrongPasswordMessage = (err as Error).message;
      }

      expect(noSuchUserMessage).toBe(wrongPasswordMessage);
    });

    it('returns the user and a signed JWT on successful login', async () => {
      const correctHash = await hashPassword(loginInput.password);
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 'existing-id',
        email: loginInput.email,
        password: correctHash,
        name: 'Jane Doe',
        role: Role.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await authService.login(loginInput);

      expect(result.user).not.toHaveProperty('password');
      expect(result.user.email).toBe(loginInput.email);
      expect(typeof result.token).toBe('string');
    });
  });
});
