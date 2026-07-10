// AuthController: translates HTTP requests into AuthService calls and
// AuthService results into HTTP responses. Deliberately THIN -- no business
// logic here. If you find yourself writing an `if` statement that isn't
// about HTTP status codes, it probably belongs in the service instead.

import { Request, Response } from 'express';
import { AuthService } from '@services/auth.service';
import { UserRepository } from '@repositories/user.repository';

// Composition root for this controller: we construct the concrete
// dependencies (UserRepository -> AuthService) here, once, at module load
// time. In a larger app this wiring would live in a dedicated DI container,
// but for our scale, doing it explicitly here keeps the dependency graph
// easy to trace by reading the code.
const authService = new AuthService(new UserRepository());

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    // req.body is already validated + sanitized by validateBody(registerSchema)
    // middleware by the time it reaches here.
    const result = await authService.register(req.body);

    // 201 Created is the correct status for "a new resource was created" --
    // not 200, which implies an existing resource was simply fetched/acted
    // upon.
    res.status(201).json(result);
  }

  async login(req: Request, res: Response): Promise<void> {
    const result = await authService.login(req.body);
    res.status(200).json(result);
  }
}
