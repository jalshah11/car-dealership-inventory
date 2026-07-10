// AuthService: the business logic for registration and login. Framework-
// agnostic on purpose -- no req/res, no HTTP status codes directly (those
// live in AppError), no Prisma calls directly (those live in
// UserRepository). This is the layer where the actual RULES of the domain
// live, which is exactly why it's the layer with the most unit tests.

import { UserRepository } from '@repositories/user.repository';
import { RegisterInput, LoginInput } from '@validators/auth.validator';
import { hashPassword, comparePassword } from '@utils/password';
import { signToken } from '@utils/jwt';
import { ConflictError, UnauthorizedError } from '@utils/app-error';
import { toSafeUser, SafeUser } from '@dtos/user.dto';
import { Role } from '@prisma/client';

interface AuthResult {
  user: SafeUser;
  token: string;
}

export class AuthService {
  // Dependency injection via constructor: AuthService receives its
  // UserRepository rather than constructing one itself. This is WHY the
  // unit tests above could pass in a mock -- if AuthService did
  // `new UserRepository()` internally, we'd have no way to substitute a
  // fake one without also connecting to a real database.
  constructor(private readonly userRepository: UserRepository) {}

  async register(input: RegisterInput): Promise<AuthResult> {
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      // 409 Conflict is the correct HTTP semantics for "this resource
      // already exists" -- distinct from 400 (malformed request) or 422
      // (semantically invalid but well-formed).
      throw new ConflictError('An account with this email already exists');
    }

    const hashedPassword = await hashPassword(input.password);

    // We explicitly hardcode role: USER here rather than trusting any
    // `role` field that might have survived from the input. Even though
    // registerSchema already strips it, defense in depth means the SERVICE
    // layer doesn't blindly trust that the validator was applied correctly
    // upstream either.
    const user = await this.userRepository.create({
      email: input.email,
      password: hashedPassword,
      name: input.name,
      role: Role.USER,
    });

    const token = signToken({ userId: user.id, role: user.role });

    return { user: toSafeUser(user), token };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await this.userRepository.findByEmail(input.email);

    // SECURITY: we deliberately throw the SAME error message whether the
    // user doesn't exist OR the password is wrong. If these differed, an
    // attacker could enumerate valid emails by observing which error comes
    // back (a "user enumeration" vulnerability) -- one of the most common
    // real-world auth bugs, and a great interview talking point.
    const invalidCredentialsError = new UnauthorizedError('Invalid email or password');

    if (!user) {
      throw invalidCredentialsError;
    }

    const passwordMatches = await comparePassword(input.password, user.password);
    if (!passwordMatches) {
      throw invalidCredentialsError;
    }

    const token = signToken({ userId: user.id, role: user.role });

    return { user: toSafeUser(user), token };
  }
}
