import { Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '@middleware/auth.middleware';
import { signToken } from '@utils/jwt';
import { Role } from '@prisma/client';
import { AppError } from '@utils/app-error';

function mockRes(): Response {
  return {} as Response;
}

function mockNext(): NextFunction {
  return jest.fn();
}

describe('authenticate middleware', () => {
  it('attaches req.user and calls next() for a valid Bearer token', () => {
    const token = signToken({ userId: 'user-1', role: Role.USER });
    const req = { headers: { authorization: `Bearer ${token}` } } as unknown as Request;
    const res = mockRes();
    const next = mockNext();

    authenticate(req, res, next);

    expect(req.user).toMatchObject({ userId: 'user-1', role: Role.USER });
    expect(next).toHaveBeenCalledWith(); // called with no error
  });

  it('calls next(err) with a 401 AppError when no Authorization header is present', () => {
    const req = { headers: {} } as unknown as Request;
    const res = mockRes();
    const next = mockNext();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
  });

  it('calls next(err) with a 401 AppError when the header is malformed (missing Bearer prefix)', () => {
    const token = signToken({ userId: 'user-1', role: Role.USER });
    const req = { headers: { authorization: token } } as unknown as Request;
    const res = mockRes();
    const next = mockNext();

    authenticate(req, res, next);

    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
  });

  it('calls next(err) with a 401 AppError for an invalid/expired token', () => {
    const req = { headers: { authorization: 'Bearer not-a-real-token' } } as unknown as Request;
    const res = mockRes();
    const next = mockNext();

    authenticate(req, res, next);

    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
  });
});

describe('authorize middleware', () => {
  it('calls next() when the user has one of the allowed roles', () => {
    const req = { user: { userId: 'user-1', role: Role.ADMIN } } as unknown as Request;
    const res = mockRes();
    const next = mockNext();

    authorize(Role.ADMIN)(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('calls next(err) with a 403 AppError when the user lacks an allowed role', () => {
    const req = { user: { userId: 'user-1', role: Role.USER } } as unknown as Request;
    const res = mockRes();
    const next = mockNext();

    authorize(Role.ADMIN)(req, res, next);

    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(403);
  });

  it('calls next(err) with a 401 AppError if req.user is missing (authenticate was skipped)', () => {
    const req = {} as unknown as Request;
    const res = mockRes();
    const next = mockNext();

    authorize(Role.ADMIN)(req, res, next);

    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
  });
});
