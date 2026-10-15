# DevDrive API

DevDrive is a Node.js and Express backend for user accounts and virtual file storage. It uses MongoDB for application data and includes optional integrations for Redis, S3, OAuth, email, and payment providers.

## Run locally

Requirements: Node.js 20.19 or newer, npm, and MongoDB.

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set `MONGODB_URL` and `JWT_SECRET_KEY`.
3. Start the development server with `npm run dev`, or start it with `npm start`.
4. Check `GET /health` for the process health response.

The default port is `4000`. The server waits for MongoDB before accepting requests and closes the HTTP and database connections on `SIGINT` or `SIGTERM`.

## Layout

```text
config/          External service and application configuration
controllers/     HTTP request/response handlers, grouped by API version
errors/          Application error types and response helpers
factories/       Provider selection
middlewares/     Request authentication, authorization, and validation
models/          Mongoose schemas
providers/       External OAuth and payment provider adapters
repositories/    Persistence adapters (MongoDB, Redis, and S3)
routers/         Versioned Express route composition
services/        Application use cases, grouped by version/integration
utils/           Environment, response, validation, and shared helpers
webhooks/        Payment provider webhook handlers
server.js        Process lifecycle and database startup
app.js           Express middleware and route assembly
```

Keep HTTP concerns in controllers and routers, business rules in services, and persistence/provider details behind repositories and provider adapters. Add new API versions under `routers/`, `controllers/`, and `services/` without mixing transport logic into models.

## Active routes

- `GET /health`
- `POST /api/v2/payments/subscriptions`
- `POST /api/v2/webhooks/subscriptions/razorpay`
- `POST /api/v2/webhooks/subscriptions/stripe`

Payment creation requires a valid authenticated `req.user`; the authentication route/middleware wiring is not yet enabled in the v2 router. Configure the relevant provider credentials and provider plan IDs before using payment endpoints. Webhook routes must receive raw JSON bodies for signature verification.

## Configuration

See `.env.example` for supported environment variable names. Do not commit `.env` or provider credentials. MongoDB is required; Redis, SMTP, S3, OAuth, and payment configuration is only needed for the features that use those integrations. Set `CORS_ORIGINS` to a comma-separated list of trusted frontend origins.

## Notes

The project contains legacy v1 handlers and experimental standalone scripts alongside the active v2 API. They are not mounted by the current Express application. Promote code from those areas into the versioned router and service layers only after wiring and reviewing its dependencies.
