# DevDrive – Architecture & Flows

## 1. System overview (Docker Compose)

```mermaid
flowchart LR
    subgraph Browser
        UI["Next.js pages<br/>(React 19, Tailwind)"]
    end

    subgraph Docker["docker compose"]
        FE["frontend :3000<br/>Next.js standalone"]
        API["server :4000<br/>Express + TypeScript"]
        MONGO[("MongoDB<br/>users, files, dirs,<br/>plans, subscriptions, OTP")]
        REDIS[("Redis<br/>sessions")]
        DISK[/"file-storage volume<br/>uploaded bytes"/]
    end

    subgraph External["Optional external services"]
        GOOGLE["Google Sign-In"]
        GITHUB["GitHub OAuth"]
        STRIPE["Stripe"]
        RAZOR["Razorpay"]
        SMTP["SMTP (OTP email)"]
        S3["AWS S3"]
    end

    UI -- "HTML/JS" --> FE
    UI -- "REST + signed cookie<br/>(fetch credentials: include)" --> API
    API --> MONGO
    API --> REDIS
    API --> DISK
    API -.-> GOOGLE
    API -.-> GITHUB
    API -.-> STRIPE
    API -.-> RAZOR
    API -.-> SMTP
    API -.-> S3
    STRIPE -. "webhook" .-> API
    RAZOR -. "webhook" .-> API
```

## 2. How the client and backend connect

- The browser loads pages from the **frontend** (port 3000) and then calls the **API directly** at `NEXT_PUBLIC_API_URL` (default `http://localhost:4000/api`). The frontend server never proxies API calls.
- All calls go through one class, `ApiService` (`frontend/src/services/api.service.ts`), using `fetch(..., { credentials: 'include' })`. File uploads use `XMLHttpRequest` so the progress bar works.
- Login sets an **HTTP-only, signed `sessionId` cookie**. The browser sends it automatically on every call. The API also accepts `Authorization: Bearer <sessionId>`.
- **CORS** allows only the origins in `CORS_ORIGINS` (the frontend URL) with credentials.
- `AuthContext` calls `GET /users/profile` on page load to find out who is signed in, and every page redirects or hides content based on that user and role.

```mermaid
sequenceDiagram
    participant B as Browser
    participant F as Frontend :3000
    participant A as API :4000
    participant R as Redis
    participant M as MongoDB

    B->>F: GET /login (page)
    F-->>B: HTML + JS
    B->>A: POST /api/users/login {email, password}
    A->>M: find user, verify argon2 hash
    A->>R: SET session:<uuid> = userId (7 days)
    A-->>B: 200 + Set-Cookie sessionId (httpOnly, signed)
    B->>A: GET /api/users/profile (cookie)
    A->>R: GET session:<uuid>
    A->>M: load user
    A-->>B: 200 { data: user }
```

## 3. Backend architecture (layers and patterns)

```mermaid
flowchart TB
    REQ["HTTP request"] --> MW1["helmet, cookie-parser, cors"]
    MW1 --> ROUTER["Routers per module<br/>/auth /users /otp /directory /files /payments /webhooks"]
    ROUTER --> SESS["SessionMiddleware<br/>cookie/bearer to userId"]
    SESS --> AUTHMW["AuthMiddleware<br/>load user, reject disabled"]
    AUTHMW --> ROLE["authorizeRoles(...)<br/>owner inherits admin and manager"]
    ROLE --> CTRL["Controller<br/>HTTP only"]
    CTRL --> SVC["Service<br/>business rules"]
    SVC --> REPO["Repository<br/>Mongo / Redis"]
    SVC --> STRAT["Strategies from factories"]
    REPO --> DB[("MongoDB / Redis")]
    CTRL --> ERR["ErrorMiddleware<br/>AppError, Mongoose, JSON errors"]
```

### Composition root and design patterns

```mermaid
classDiagram
    class AppContainer {
        +constructor(overrides)
        wires repositories, services, controllers
    }
    class ISessionRepository
    class RedisSessionRepository
    class InMemorySessionRepository
    ISessionRepository <|.. RedisSessionRepository
    ISessionRepository <|.. InMemorySessionRepository
    class SessionRepositoryFactory

    class OAuthProvider {
        <<abstract>>
        +authenticate(credential)
    }
    class GoogleOAuthProvider
    class GithubOAuthProvider
    OAuthProvider <|-- GoogleOAuthProvider
    OAuthProvider <|-- GithubOAuthProvider
    class OAuthProviderFactory

    class PaymentProvider {
        <<abstract>>
        +createSubscription()
        +createOneTimePayment()
    }
    class StripeProvider
    class RazorpayProvider
    PaymentProvider <|-- StripeProvider
    PaymentProvider <|-- RazorpayProvider
    class PaymentProviderFactory

    class IFileStorage
    class LocalDiskStorage
    class IUploadUrlSigner
    class S3UploadUrlSigner
    IFileStorage <|.. LocalDiskStorage
    IUploadUrlSigner <|.. S3UploadUrlSigner
    class StorageFactory

    AppContainer --> SessionRepositoryFactory
    AppContainer --> OAuthProviderFactory
    AppContainer --> PaymentProviderFactory
    AppContainer --> StorageFactory
```

| Principle / pattern | Where |
|---|---|
| Dependency injection (constructor) | `container.ts` is the only place concrete classes are created |
| Strategy | session store, OAuth provider, payment provider, file storage |
| Factory | `factories/*.factory.ts` choose a strategy from config |
| Repository | `*.repository.ts` isolate Mongo/Redis from business logic |
| Interface segregation / DIP | services depend on `IUserRepository`, `ISessionService`, `IFileStorage`, ... |
| Single responsibility | controller (HTTP) → service (rules) → repository (data) |

## 4. Key flows

### 4.1 OAuth login (Google and GitHub)

```mermaid
sequenceDiagram
    participant B as Browser
    participant A as API
    participant P as Google / GitHub
    Note over B,P: Google
    B->>P: Google button gives ID token
    B->>A: POST /auth/google {idToken}
    A->>P: verify token
    Note over B,P: GitHub (popup)
    B->>A: window.open GET /auth/github
    A-->>B: 302 to GitHub authorize
    P-->>A: GET /auth/github/callback?code
    A->>P: exchange code, fetch profile
    A-->>B: HTML postMessage {success, sessionId, user} to opener
    B->>A: POST /auth/set-cookie {sessionId}
    Note over A: Both: find or create user + root dir, create session, set cookie
```

### 4.2 File upload and download

```mermaid
sequenceDiagram
    participant B as Browser
    participant A as API
    participant M as MongoDB
    participant D as Disk volume
    B->>A: POST /files/upload-stream/:name (raw body, header parentdirid)
    A->>M: check quota and parent folder ownership
    A->>M: create file record, add size up the folder tree
    A->>D: stream body to <fileId><ext>
    A-->>B: 201 file
    B->>A: GET /files/:id?action=download
    A->>M: verify owner
    A->>D: read file
    A-->>B: file bytes
```

The upload route skips the JSON body parser, so files of any type (including `.json`) are stored byte for byte. If `S3_BUCKET` is set, `POST /files/presigned-url` returns a signed S3 upload URL instead.

### 4.3 Payments and webhooks

```mermaid
sequenceDiagram
    participant B as Browser
    participant A as API
    participant PP as Stripe / Razorpay
    B->>A: POST /payments/subscriptions {planId, type, cycle, provider}
    A->>A: validate plan pricing, factory picks provider
    A->>PP: create checkout session / subscription
    A-->>B: {flow: redirect|popup, url / ids}
    B->>PP: pays on provider page
    PP->>A: POST /webhooks/subscriptions/{stripe|razorpay} (raw body)
    A->>A: verify signature
    A->>A: update subscription and storage quota
```

### 4.4 Role-based administration

```mermaid
flowchart LR
    U[user] --- M[manager] --- AD[admin] --- O[owner]
```

| Action | manager | admin | owner |
|---|---|---|---|
| List all / active / disabled users | yes | yes | yes |
| Change a role | user and manager targets only, cannot grant admin/owner | cannot touch admin/owner accounts | any |
| Soft delete / recover | no | yes (not another admin or owner) | yes (not an owner) |
| Hard delete | no | no | yes (not an owner) |

Disabled users are blocked at login and on every request.

## 5. Features

| Area | Features |
|---|---|
| Accounts | Email/password register and login, Google and GitHub sign-in, set password for OAuth users, optional email OTP check |
| Sessions | Signed HTTP-only cookie, Redis (or in-memory) store, logout, logout from all devices |
| Drive | Nested folders, upload with progress, download, rename, recursive delete, per-folder size totals, storage quota and usage |
| Access control | Four roles (user, manager, admin, owner), soft and hard delete, recover, role changes with hierarchy rules |
| Billing | Plans, one-time and subscription pricing, Stripe and Razorpay checkout, webhook verification |
| Platform | Helmet, CORS, central error handling, health check, Docker Compose deployment |
| UI | Design-token theme, reusable UI components, responsive navbar, toasts, confirm dialogs |

## 6. Repository layout

```text
DevDrive/
├─ docker-compose.yml        mongo + redis + server + frontend
├─ server/
│  ├─ src/
│  │  ├─ server.ts           startup and graceful shutdown
│  │  ├─ app.ts              middleware and routers
│  │  ├─ container.ts        dependency wiring
│  │  ├─ modules/            auth, user, otp, directory, file, payment, session, webhook
│  │  ├─ factories/          session, oauth, payment, storage
│  │  ├─ providers/          oauth, payment, storage strategies
│  │  ├─ middlewares/        session, auth, roles, errors
│  │  ├─ models/             Mongoose schemas
│  │  └─ shared/             env, errors, types, helpers
│  └─ test/                  unit and integration tests (56)
└─ frontend/
   └─ src/
      ├─ app/                pages: /, login, register, profile, pricing, admin/users
      ├─ components/         Navbar, AuthShell, ui/ design system
      ├─ context/            AuthContext
      ├─ services/           ApiService (all REST calls)
      └─ lib/ types/         helpers and shared types
```
