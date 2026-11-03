# DevDrive

Cloud file storage with role-based access control, OAuth sign-in and subscription plans.

| Part | Stack | Path |
| --- | --- | --- |
| API | Node 22, Express 4, TypeScript, MongoDB (Mongoose), Redis sessions | [`server/`](server) |
| Web | Next.js 16, React 19, Tailwind v4 | [`frontend/`](frontend) |

## Run with Docker (recommended)

```bash
cp .env.example .env        # optional - the defaults work for a local demo
docker compose up --build
```

- Web app: http://localhost:3000
- API: http://localhost:4000 (health check: `/health`)

Compose starts MongoDB, Redis, the API and the web app. Uploaded files, MongoDB data and Redis data live in named volumes (`docker compose down -v` removes them).

Integrations that need credentials (Google/GitHub sign-in, SMTP, Stripe, Razorpay, S3) are disabled until you fill the matching variables in `.env`. Everything else works without them. Note that `NEXT_PUBLIC_*` values are baked into the web image at build time, so re-run `docker compose up --build` after changing them.

> For an HTTPS deployment set `NODE_ENV=production` for the `server` service (cookies then become `Secure; SameSite=None`) and set `FRONTEND_URL`/`NEXT_PUBLIC_API_URL` to your public URLs.

## Run without Docker

```bash
# API  (needs MongoDB; Redis is optional - sessions fall back to memory)
cd server && cp .env.example .env && npm install && npm run dev

# Web
cd frontend && npm install && npm run dev
```

## Tests

```bash
cd server
npm test                 # unit + integration (integration spawns a throw-away `mongod`, so MongoDB must be installed)
npm run typecheck
```

Set `MONGODB_TEST_URL` to run the integration tests against an existing MongoDB instead.
See [`server/README.md`](server/README.md) for the architecture.
