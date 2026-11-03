# DevDrive API

Express + TypeScript backend for user accounts, virtual file storage, OAuth and subscriptions.

## Architecture

```text
src/
  server.ts            Process lifecycle (DB/Redis connect, graceful shutdown)
  app.ts               Express assembly: security middleware, routers, error handling
  container.ts         Composition root - the ONLY place concrete classes are wired (constructor DI)
  config/              Infrastructure clients (MongoDB, Redis, SMTP)
  factories/           Factory pattern: session store, OAuth provider, payment provider, file storage
  providers/           Strategy pattern implementations
    oauth/             OAuthProvider -> Google, GitHub
    payment/           PaymentProvider -> Stripe, Razorpay
    storage/           IFileStorage -> LocalDiskStorage, IUploadUrlSigner -> S3UploadUrlSigner
  modules/<feature>/   controller (HTTP) -> service (business rules) -> repository (persistence)
  middlewares/         Session, auth, role authorization, error handling
  models/              Mongoose schemas
  shared/              Errors, types, env, helpers
test/                  Unit tests (fakes) and API integration tests (real MongoDB)
```

Principles applied: every service depends on an interface (`IUserRepository`, `ISessionService`, `IFileStorage`, ...), so storage, session and payment backends can be swapped without touching business code; providers are selected by factories and injected as resolvers; controllers hold no business logic.

Sessions use Redis when `REDIS_URL`/`REDIS_HOST` is set (or `SESSION_STORE=redis`), otherwise an in-memory store.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Watch mode (tsx, loads `.env`) |
| `npm run build` / `npm start` | Compile to `dist/` and run |
| `npm test` | Unit + integration tests |
| `npm run typecheck` | Type check only |

## HTTP API (all under `/api`, JSON `{ success, message?, data? }`)

| Area | Endpoints |
| --- | --- |
| Health | `GET /health` |
| Users | `POST /users/register`, `POST /users/login`, `POST /users/logout`, `POST /users/logout/all-devices`, `GET /users/profile`, `POST /users/set-password` |
| Admin | `GET /users/admin/{all,active,disabled}`, `DELETE /users/admin/:id`, `DELETE /users/admin/:id/hard` (owner), `PATCH /users/admin/:id/recover`, `PATCH /users/admin/:id/role` |
| OAuth | `POST /auth/google`, `GET /auth/github`, `GET /auth/github/callback`, `POST /auth/set-cookie` |
| OTP | `POST /otp/send-otp`, `POST /otp/verify-otp` |
| Directories | `GET/POST /directory`, `GET/PATCH/DELETE /directory/:id` |
| Files | `POST /files/upload-stream/:filename`, `GET/PATCH/PUT/DELETE /files/:id`, `GET /files/storage/usage`, `POST /files/presigned-url` |
| Payments | `GET /payments/plans`, `POST /payments/subscriptions`, `GET /payments/my-subscription` |
| Webhooks | `POST /webhooks/subscriptions/{razorpay,stripe}` |

## Environment

See `.env.example`. All integrations are optional; missing credentials produce clear errors only on the endpoints that need them.
