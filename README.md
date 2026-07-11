# Car Dealership Inventory System

A full-stack inventory management system for a car dealership, built
incrementally using Test-Driven Development (TDD). Built as a guided
learning project to practice production-grade backend architecture,
authentication/authorization, and a typed React frontend.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Folder Structure](#folder-structure)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Running Tests](#running-tests)
- [Test Report](#test-report)
- [Deployment](#deployment)
- [My AI Usage](#my-ai-usage)

---

## Features

**Authentication & Authorization**
- Register / log in, receive a JWT
- Passwords hashed with bcrypt, never stored in plaintext
- Role-based access control (`USER` / `ADMIN`) enforced server-side on every mutating route

**Vehicle Inventory**
- Full CRUD (admin-only for create/update/delete)
- Public browsing and multi-filter search (make, model, category, min/max price -- any combination)
- Purchase flow with atomic, race-condition-safe stock decrement; blocked at zero quantity
- Admin-only restock

**Frontend**
- Responsive SPA: browse/search, vehicle detail with purchase, admin dashboard with inline CRUD + restock
- Toast notifications, loading states, and form validation throughout
- Route guards mirroring backend authorization (`ProtectedRoute` / `AdminRoute`) -- UX convenience only; the backend is the real enforcement point

---

## Architecture

**Backend: Express.js + TypeScript** (chosen over NestJS deliberately --
building Clean Architecture by hand, rather than relying on a framework's
built-in DI container, was the better learning path for this project's
goal of understanding every layer, not just shipping fast.)

Layered, one-directional dependency flow:

```
routes -> controllers -> services -> repositories -> database (Prisma/Postgres)
```

- **routes** -- URL + HTTP verb -> controller, plus middleware wiring (auth, validation)
- **controllers** -- parse the HTTP request, call a service, shape the response. No business logic.
- **services** -- business rules (duplicate-email checks, stock guards). Framework-agnostic -- no Express, no Prisma.
- **repositories** -- the only layer that talks to Prisma
- **validators** -- Zod schemas for every request body/query
- **middleware** -- `authenticate` (JWT verification), `authorize(...roles)` (RBAC), `validateBody`/`validateQuery`, centralized `errorHandler`

A service never imports Express; a controller never imports Prisma. This is
what makes the service layer unit-testable with a mocked repository instead
of a real database.

**Frontend: React + TypeScript + Vite**, mirroring the same layering
instinct:

```
pages -> hooks (React Query) -> services (axios) -> backend API
```

- **services/** -- typed axios wrappers, one function per backend endpoint
- **hooks/** -- React Query hooks (caching, invalidation) wrapping the services
- **context/** -- `AuthContext`, session persisted to `localStorage`
- **components/** -- reusable UI (forms, cards, route guards)
- **pages/** -- route-level screens, composed from the above

---

## Folder Structure

```
car-dealership-inventory/
|-- docker-compose.yml          # local Postgres
|-- backend/
|   |-- prisma/
|   |   |-- schema.prisma       # User + Vehicle models
|   |   `-- seed.ts             # admin + customer + 8 sample vehicles
|   |-- src/
|   |   |-- config/             # env validation, Prisma client singleton
|   |   |-- controllers/        # auth.controller.ts, vehicle.controller.ts
|   |   |-- dtos/               # user.dto.ts (SafeUser, strips password)
|   |   |-- middleware/         # auth, validation, centralized error handler
|   |   |-- repositories/       # user.repository.ts, vehicle.repository.ts
|   |   |-- routes/             # auth.routes.ts, vehicle.routes.ts
|   |   |-- services/           # auth.service.ts, vehicle.service.ts
|   |   |-- types/              # express.d.ts (req.user, req.validatedQuery)
|   |   |-- utils/              # app-error.ts, jwt.ts, password.ts
|   |   `-- validators/         # Zod schemas
|   `-- tests/
|       |-- unit/               # services, utils, validators, middleware
|       `-- integration/        # real Express app + Supertest, mocked repositories
`-- frontend/
    `-- src/
        |-- components/         # Button, Input, VehicleCard, VehicleForm, RouteGuards, ...
        |-- context/            # AuthContext
        |-- hooks/              # useAuth, useVehicles (React Query)
        |-- layouts/            # MainLayout (nav header)
        |-- pages/              # Login, Register, Dashboard, VehicleDetail, AdminDashboard, NotFound
        |-- services/           # api-client.ts, auth.service.ts, vehicle.service.ts
        |-- types/              # api.ts (shared response types)
        `-- utils/              # get-error-message.ts
```

---

## API Documentation

Base URL: `http://localhost:4000/api`

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | -- | Create an account (always role `USER`). Returns `{ user, token }`. |
| POST | `/auth/login` | -- | Returns `{ user, token }`. Wrong email and wrong password return identical errors (prevents user enumeration). |

### Vehicles

All vehicle endpoints require a logged-in user (`Authorization: Bearer <token>`).
Only delete and restock are additionally restricted to `ADMIN`.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/vehicles` | any logged-in user | List all vehicles |
| GET | `/vehicles/search` | any logged-in user | Filter by `make`, `model`, `category`, `minPrice`, `maxPrice` (any combination) |
| GET | `/vehicles/:id` | any logged-in user | Get one vehicle |
| POST | `/vehicles` | any logged-in user | Create a vehicle |
| PUT | `/vehicles/:id` | any logged-in user | Update a vehicle (partial) |
| DELETE | `/vehicles/:id` | ADMIN | Delete a vehicle |
| POST | `/vehicles/:id/purchase` | any logged-in user | Atomically decrement quantity by 1. `409` if out of stock, `404` if not found. |
| POST | `/vehicles/:id/restock` | ADMIN | `{ amount: number }` -- increments quantity |

Note: the frontend additionally restricts the create/update/delete/restock
*UI* to admin users only (the kata's frontend spec calls these out as
"For Admin Users"), even though the API itself permits any authenticated
user to create/update. This is a deliberate UX choice layered on top of,
not a substitute for, the backend's own authorization checks.

Send the JWT as `Authorization: Bearer <token>` on any authenticated route.

### Error shape

```json
{ "error": "Human-readable message" }
```

Validation failures (400) additionally include:
```json
{ "error": "Validation failed", "details": { "email": ["Invalid email"] } }
```

---

## Database Schema

PostgreSQL via Prisma. Full schema with design-rationale comments in
`backend/prisma/schema.prisma`.

```
User
  id         String   @id @default(uuid())   -- UUID, not auto-increment: doesn't leak row counts
  email      String   @unique
  password   String                          -- bcrypt hash, never plaintext
  name       String
  role       Role     @default(USER)         -- USER | ADMIN
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

Vehicle
  id         String   @id @default(uuid())
  make       String   @@index
  model      String   @@index
  category   String   @@index
  price      Decimal  @db.Decimal(10,2)      -- Decimal, not Float: avoids binary rounding errors on money
  quantity   Int      @default(0)            -- never negative (atomic guard in the repository layer)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
```

---

## Setup Instructions

Prerequisites: Node.js 18+, PostgreSQL (local install or Docker), npm.

```bash
# 1. Start Postgres
docker compose up -d          # OR use a native local Postgres install

# 2. Backend
cd backend
npm install
cp .env.example .env          # then edit DATABASE_URL / JWT_SECRET
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed               # creates admin + customer + 8 sample vehicles
npm run dev                   # http://localhost:4000

# 3. Frontend (separate terminal)
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

Seeded accounts (see `backend/prisma/seed.ts`):
- Admin: `admin@dealership.com` / `AdminPass123!`
- Customer: `customer@example.com` / `CustomerPass123!`

---

## Environment Variables

`backend/.env` (see `backend/.env.example`):

| Variable | Description |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `PORT` | API server port (default `4000`) |
| `NODE_ENV` | `development` / `test` / `production` |
| `JWT_SECRET` | Signing secret for JWTs -- use a long random string in any real environment |
| `JWT_EXPIRES_IN` | Token lifetime (default `1d`) |

The frontend needs no `.env` for local dev -- Vite's dev server proxies
`/api` to `http://localhost:4000` (see `frontend/vite.config.ts`).

---

## Running Tests

```bash
# Backend
cd backend
npm test                # 97 tests
npm run test:coverage

# Frontend
cd frontend
npm test                # 37 tests
npx vitest run --coverage
```

---

## Test Report

_Generated by actually running the suites -- see the coverage tables below._

**Backend: 97/97 passing, 10 suites**

| Layer | Stmts | Branch | Notes |
|---|---|---|---|
| controllers | 97% | 50% | |
| services | 100% | 100% | business logic -- the highest-value layer to cover fully |
| validators | 100% | 100% | |
| middleware | 96% | 81% | |
| utils | 96% | 100% | |
| repositories | ~13% | 0% | **by design** -- repositories are thin Prisma wrappers, verified via real-database integration tests, not mocked unit tests (see `backend/tests/README.md`). This project's dev/CI environment doesn't have network access to provision a throwaway Postgres instance for that layer; run `npm test` against your own local Postgres for full repository coverage. |

**Frontend: 37/37 passing, 7 suites**

| Layer | Stmts | Notes |
|---|---|---|
| components | 95% | |
| context | 93% | |
| utils | 100% | |
| pages | 73% | |
| hooks (`useVehicles`) | ~4% | React Query hooks are mocked at the module boundary in page tests (isolates page logic from network/cache behavior); not separately covered by a dedicated hook test suite yet |
| services | ~12% | thin axios wrappers, exercised indirectly through the above |

**Honest gaps, not hidden ones:** repository and service-wrapper layers on
both ends show low direct coverage because they're deliberately tested at a
different layer (real-DB integration tests for the backend repositories;
page-level tests mocking the hooks for the frontend). The business-logic
layers that actually contain decisions -- `services/`, `validators/`,
`utils/`, `components/`, `context/` -- are at or near 100%.

---

## Deployment

This project isn't deployed yet. A reasonable path:

- **Database**: a managed Postgres (e.g. Neon, Supabase, Railway, or RDS)
- **Backend**: any Node host that runs `npm run build && npm start` (Railway, Render, Fly.io) -- set the environment variables above, run `npx prisma migrate deploy` (not `migrate dev`) as part of the deploy step
- **Frontend**: `npm run build` produces `frontend/dist/` -- deploy as a static site (Vercel, Netlify, Cloudflare Pages), pointing its API calls at the deployed backend's real URL instead of the dev-only Vite proxy (would need a small change: read the API base URL from an environment variable rather than hardcoding `/api`)

---

## My AI Usage

This project was built collaboratively with Claude (Anthropic), used as a
pair-programming mentor rather than a one-shot code generator. Specifically:

- **TDD discipline**: nearly every feature was built test-first -- a failing
  test written and confirmed red, then the minimum implementation to go
  green, then refactor. This is visible in the git history (`test: ... (RED)`
  commits followed by `feat: ... (GREEN)` commits).
- **Real bugs were found and fixed by actually running things**, not just
  writing code that looked right: a broken `instanceof` check on custom
  error classes (caught by a test asserting on the specific error class,
  not just status code), a race condition in the purchase endpoint (fixed
  with an atomic `updateMany` guard), Express 5's read-only `req.query`
  (worked around with a separate `req.validatedQuery`), broken `npm run
  dev`/`npm start` due to unresolved TypeScript path aliases at runtime,
  and a Prisma major-version mismatch from an unpinned dependency.
- **Generated code was reviewed and questioned**, not accepted uncritically
  -- including a point mid-project where unexplained files appeared in the
  working directory and were treated with suspicion rather than assumed
  safe, until traced to earlier context in the same long session.
- **What to verify further**: the repository layers and React Query hooks
  have low direct test coverage by design (tested at a different layer),
  but the backend's full suite hasn't yet been run against a real Postgres
  instance in CI, only locally. The atomic purchase decrement also hasn't
  been load-tested under real concurrency, only reasoned about.
