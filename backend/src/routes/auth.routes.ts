// Auth routes: maps HTTP verb + path to controller methods, with
// validation middleware in front. This file should stay declarative --
// readable as a table of "what endpoints exist", nothing more.

import { Router } from 'express';
import { AuthController } from '@controllers/auth.controller';
import { validateBody } from '@middleware/validate.middleware';
import { registerSchema, loginSchema } from '@validators/auth.validator';
import { asyncHandler } from '@middleware/error.middleware';

const router = Router();
const authController = new AuthController();

router.post('/register', validateBody(registerSchema), asyncHandler(authController.register.bind(authController)));

router.post('/login', validateBody(loginSchema), asyncHandler(authController.login.bind(authController)));

export default router;
