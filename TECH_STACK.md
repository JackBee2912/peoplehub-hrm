# PeopleHub HRM System — Tech Stack

> Document Version: 1.0
> Created: April 2026
> Author: Technical Researcher — AGENT-TEAM
> Status: Approved for architecture design phase

---

## Decision Criteria

Technology selections were evaluated against these criteria, weighted by importance for an enterprise HRM system:

| Criterion | Weight | Rationale |
|-----------|--------|-----------|
| Enterprise readiness | 25% | Must handle 5,000+ employees, multi-tenant, role-based access |
| Developer productivity | 20% | Fast iteration across 12 modules, large feature surface |
| Type safety | 15% | Payroll, compliance, and data integrity demand zero-runtime surprises |
| Ecosystem maturity | 15% | HRM needs rich components: tables, forms, charts, calendars, file uploads |
| Scalability | 10% | Growth from 500 to 5,000+ companies, 500K total employees |
| Cost | 10% | All selected technologies are open-source / free-tier capable |
| Community support | 5% | Active maintenance, frequent updates, available talent pool |

---

## 1. FRONTEND

### 1.1 Framework: React 19 + TypeScript 5.x

**Why:** React dominates the enterprise admin dashboard space. TypeScript provides compile-time type safety critical for payroll calculations, permission matrices, and data-heavy forms. React 19 brings Server Components readiness, improved hooks, and better performance.

**Version:** React 19.x, TypeScript 5.4+

**Key dependencies:**
```
react@^19.0.0
react-dom@^19.0.0
typescript@^5.4.0
@types/react@^19.0.0
@types/react-dom@^19.0.0
```

**Alternatives considered:**
- **Vue 3 + Nuxt** — Excellent DX but smaller enterprise admin ecosystem; fewer pre-built dashboard components
- **Angular 17+** — Full-featured but heavy; slower dev iteration; overkill for our SPA + future SSR needs
- **SvelteKit** — Great performance but immature enterprise UI library ecosystem; smaller talent pool

---

### 1.2 UI Library: Ant Design 5.x

**Why:** Ant Design is purpose-built for enterprise admin dashboards. It offers 60+ components including complex data tables with filtering/sorting, tree selects, cascading forms, step wizards (for onboarding), and advanced calendars (for attendance). The design system is consistent and professional out-of-the-box.

**Version:** antd@^5.22.0

**Key dependencies:**
```
antd@^5.22.0
@ant-design/icons@^5.5.0
@ant-design/pro-components@^2.7.0  # ProTable, ProForm, ProLayout
```

**Why not Material-UI (MUI):**
- MUI is excellent but requires more customization to achieve enterprise admin look
- Ant Design Pro components (ProTable, ProForm, ProLayout) save weeks of development for data-grid-heavy HRM screens
- Ant Design's data table with built-in filtering, pagination, and export is superior for employee/candidate lists
- MUI's DataGrid Pro is paid; Ant Design's table is free

**Alternatives considered:**
- **MUI (Material-UI)** — Great component library but Pro DataGrid requires paid license; more customization needed
- **Radix UI + custom CSS** — Maximum flexibility but would require building every complex component from scratch
- **Chakra UI** — Good DX but fewer enterprise-grade components (no built-in complex tables, cascaders)

---

### 1.3 State Management: Zustand 4.x + React Query (TanStack Query) 5.x

**Why:** Zustand provides lightweight global state for UI preferences, auth tokens, and tenant context. TanStack Query handles all server-state (API data) with automatic caching, background refetching, optimistic updates, and pagination — eliminating 80% of manual state management boilerplate.

**Version:** zustand@^4.5.0, @tanstack/react-query@^5.60.0

**Key dependencies:**
```
zustand@^4.5.0
@tanstack/react-query@^5.60.0
@tanstack/react-query-devtools@^5.60.0
```

**Alternatives considered:**
- **Redux Toolkit** — Overly verbose for our use case; boilerplate-heavy; Zustand achieves the same with 90% less code
- **Jotai** — Atomic model is elegant but less intuitive for nested state (org hierarchies, permission trees)
- **Recoil** — Facebook-backed but slower adoption; Zustand has better TypeScript inference
- **Context API alone** — Causes unnecessary re-renders with frequent state changes (real-time notifications, live dashboards)

---

### 1.4 Routing: React Router 7.x

**Why:** Industry standard for React routing. v7 includes framework capabilities (loaders, actions) that reduce boilerplate. Supports nested routes matching our module structure (e.g., `/hrm/employees/:id/payroll`).

**Version:** react-router@^7.1.0

**Key dependencies:**
```
react-router@^7.1.0
react-router-dom@^7.1.0
```

**Alternatives considered:**
- **TanStack Router** — Type-safe routing is excellent but newer ecosystem; less community knowledge
- **Next.js App Router** — Would lock us into SSR; our app is primarily client-side dashboard with occasional SSR for public pages

---

### 1.5 Form Handling: React Hook Form 7.x + Zod 3.x

**Why:** React Hook Form minimizes re-renders (critical for forms with 30+ fields like employee profiles). Zod provides schema-first validation with TypeScript inference, enabling shared validation between frontend and backend.

**Version:** react-hook-form@^7.54.0, zod@^3.24.0

**Key dependencies:**
```
react-hook-form@^7.54.0
zod@^3.24.0
@hookform/resolvers@^3.9.0  # Zod resolver for RHF
zod-to-json-schema@^3.24.0  # Generate JSON Schema for API docs
```

**Alternatives considered:**
- **Formik + Yup** — Slower performance on large forms; Zod has better TypeScript support than Yup
- **React Final Form** — Render-props API is verbose; RHF's hook-based API is cleaner

---

### 1.6 Charts & Data Visualization: Apache ECharts 5.x + Recharts 2.x

**Why:** Apache ECharts handles complex enterprise charts (heatmaps, sankey for org charts, large datasets up to 100K points) needed for HR analytics dashboards. Recharts is used for simpler inline charts (mini sparklines in table cells). This dual approach optimizes for both power and simplicity.

**Version:** echarts@^5.5.0, recharts@^2.15.0

**Key dependencies:**
```
echarts@^5.5.0
echarts-for-react@^3.0.2
recharts@^2.15.0
```

**Alternatives considered:**
- **Chart.js** — Simpler but struggles with large datasets; lacks heatmap and org chart types
- **D3.js** — Maximum flexibility but requires building every chart from scratch; too much effort for standard dashboard charts
- **Nivo** — Beautiful but D3-based, same performance concerns for large datasets

---

### 1.7 HTTP Client: Axios 1.x

**Why:** Axios provides request/response interceptors (essential for JWT token refresh, error handling, loading states), automatic JSON transformation, request cancellation, and progress tracking (for file uploads like resumes, documents).

**Version:** axios@^1.7.0

**Key dependencies:**
```
axios@^1.7.0
axios-retry@^4.5.0  # Auto-retry for transient failures
```

**Alternatives considered:**
- **Fetch API (native)** — No interceptors; requires wrapping for token refresh; no built-in cancellation in older browsers
- **TanStack Query's fetcher** — Great for data fetching but lacks request-level control needed for file uploads and custom headers
- **Ky** — Modern but smaller ecosystem; Axios has more community plugins and examples

---

### 1.8 Testing: Vitest 2.x + React Testing Library

**Why:** Vitest is Vite-native, sharing the same config and blazing fast. React Testing Library encourages testing behavior over implementation. Together they cover unit, integration, and component testing.

**Version:** vitest@^2.1.0, @testing-library/react@^16.0.0

**Key dependencies:**
```
vitest@^2.1.0
@testing-library/react@^16.0.0
@testing-library/jest-dom@^6.6.0
@testing-library/user-event@^14.5.0
jsdom@^25.0.0
```

**Alternatives considered:**
- **Jest** — Slower with Vite; Vitest is a drop-in replacement with native Vite support
- **Playwright (unit)** — Overkill for unit tests; Playwright reserved for E2E only

---

### 1.9 Build Tool: Vite 6.x

**Why:** Vite provides near-instant HMR, native ES module support, and excellent TypeScript handling. Build times are 10-50x faster than Webpack for large projects.

**Version:** vite@^6.0.0

**Key dependencies:**
```
vite@^6.0.0
@vitejs/plugin-react@^4.3.0
vite-plugin-svgr@^4.3.0  # SVG as React components
vite-plugin-checker@^0.8.0  # Type checking during dev
```

**Alternatives considered:**
- **Webpack** — Slower HMR; complex config; Vite is the modern default
- **Turbopack** — Still in beta; not production-ready for enterprise projects
- **esbuild** — Fast but limited plugin ecosystem; Vite uses esbuild under the hood

---

### 1.10 Styling: TailwindCSS 4.x + CSS Modules

**Why:** TailwindCSS enables rapid UI development with utility classes, consistent design tokens, and small bundle sizes (PurgeCSS). CSS Modules used for component-specific complex styles (animations, complex selectors).

**Version:** tailwindcss@^4.0.0

**Key dependencies:**
```
tailwindcss@^4.0.0
@tailwindcss/vite@^4.0.0
clsx@^2.1.0
tailwind-merge@^2.6.0  # Conflicting class resolution
```

---

### 1.11 E2E Testing: Playwright

**Why:** Playwright supports multi-browser testing (Chromium, Firefox, WebKit), has excellent CI integration, auto-waiting, and tracing. Critical for testing complex HR workflows (onboarding wizard, payroll approval chain).

**Version:** playwright@^1.49.0

**Key dependencies:**
```
@playwright/test@^1.49.0
```

---

## 2. BACKEND

### 2.1 Framework: NestJS 11.x (Node.js + TypeScript)

**Why:** NestJS provides enterprise-grade architecture (dependency injection, modular design, pipes, guards, interceptors) with first-class TypeScript support. Its modular structure maps perfectly to our 12 HRM modules. Built-in support for GraphQL, WebSockets, microservices, and OpenAPI.

**Version:** @nestjs/core@^11.0.0, @nestjs/common@^11.0.0

**Key dependencies:**
```
@nestjs/core@^11.0.0
@nestjs/common@^11.0.0
@nestjs/platform-express@^11.0.0
@nestjs/jwt@^11.0.0
@nestjs/passport@^11.0.0
@nestjs/swagger@^11.0.0
@nestjs/throttler@^6.0.0
@nestjs/bullmq@^11.0.0
@nestjs/schedule@^5.0.0
@nestjs/config@^4.0.0
@nestjs/terminus@^11.0.0  # Health checks
rxjs@^7.8.0
```

**Alternatives considered:**
- **Express.js** — Too unopinionated; requires assembling architecture from scratch; no built-in DI, validation, or testing utilities
- **Fastify** — Faster than Express but smaller ecosystem; NestJS can use Fastify as adapter anyway
- **Django/FastAPI (Python)** — Good for AI but weak for complex REST APIs with RBAC; we'll use Python for AI microservice only
- **Spring Boot (Java)** — Enterprise-ready but verbose; slower dev iteration; higher infrastructure cost

---

### 2.2 ORM: Prisma 6.x

**Why:** Prisma provides type-safe database access, auto-generated TypeScript types from schema, intuitive query API, and excellent migration tooling. The Prisma schema serves as living documentation of our data model.

**Version:** prisma@^6.0.0, @prisma/client@^6.0.0

**Key dependencies:**
```
prisma@^6.0.0
@prisma/client@^6.0.0
```

**Alternatives considered:**
- **TypeORM** — More flexible but type safety is weaker; decorator-based approach is error-prone
- **Drizzle** — Emerging but smaller ecosystem; Prisma has better tooling (studio, migrations, seeding)
- **Knex.js** — Query builder only; no type generation; too low-level for rapid development
- **Sequelize** — Legacy; poor TypeScript support; active development has slowed

---

### 2.3 Authentication: JWT + Passport.js + @nestjs/jwt

**Why:** JWT for stateless token-based auth (essential for scalability). Passport.js provides flexible strategy pattern (local, JWT, SAML, OIDC) needed for multi-tenant SSO support. NestJS Passport integration provides guards and decorators.

**Version:** passport@^0.7.0, @nestjs/jwt@^11.0.0, @nestjs/passport@^11.0.0

**Key dependencies:**
```
passport@^0.7.0
@nestjs/jwt@^11.0.0
@nestjs/passport@^11.0.0
passport-jwt@^4.0.1
passport-local@^1.0.0
passport-oauth2@^1.8.0  # SSO via OAuth2/OIDC
@node-saml/passport-saml@^4.0.0  # SAML for enterprise SSO
bcrypt@^5.1.1  # Password hashing
argon2@^0.41.0  # Alternative password hashing (more secure)
```

**Alternatives considered:**
- **Session-based auth** — Doesn't scale for multi-tenant; requires sticky sessions; JWT is stateless
- **NextAuth.js** — Tied to Next.js; not compatible with our NestJS backend
- **Clerk/Auth0** — SaaS solutions add cost and vendor lock-in; we need self-hosted for data sovereignty

---

### 2.4 Validation: class-validator + class-transformer

**Why:** NestJS native integration with decorators. Enables DTO-based validation at controller level. Works seamlessly with Swagger for auto-generated API docs.

**Version:** class-validator@^0.14.0, class-transformer@^0.5.1

**Key dependencies:**
```
class-validator@^0.14.0
class-transformer@^0.5.1
```

**Alternatives considered:**
- **Zod (backend)** — Excellent but requires adapter layer for NestJS; class-validator is the NestJS standard
- **Joi** — Good but less TypeScript-friendly; class-validator decorators integrate better with NestJS ecosystem

---

### 2.5 Testing: Jest 29.x + Supertest

**Why:** Jest is the NestJS default with excellent TypeScript support. Supertest enables HTTP-level integration testing. Combined with Prisma's test database strategy, we can test full request-response cycles.

**Version:** jest@^29.7.0, supertest@^7.0.0

**Key dependencies:**
```
jest@^29.7.0
ts-jest@^29.2.0
supertest@^7.0.0
@nestjs/testing@^11.0.0
prisma-test-utils  # Isolated test databases
```

---

### 2.6 API Documentation: Swagger/OpenAPI 3.0

**Why:** NestJS Swagger module auto-generates OpenAPI specs from decorators. Interactive Swagger UI for developer testing. Enables SDK generation for Python, JavaScript, PHP (per product vision).

**Version:** @nestjs/swagger@^11.0.0

**Key dependencies:**
```
@nestjs/swagger@^11.0.0
swagger-ui-express@^5.0.0  # Embedded Swagger UI
```

**Alternatives considered:**
- **Redoc** — Beautiful docs but read-only; Swagger UI supports "Try it out" for interactive testing
- **Stoplight** — Great but external SaaS; we want self-hosted, auto-generated docs

---

### 2.7 Queue / Background Jobs: BullMQ 5.x + Redis

**Why:** BullMQ is the modern successor to Bull, built on Redis. Handles payroll processing, email sending, document processing, scheduled reports, and notification dispatch. Supports priority queues, rate limiting, repeatable jobs, and job concurrency.

**Version:** bullmq@^5.30.0

**Key dependencies:**
```
bullmq@^5.30.0
@nestjs/bullmq@^11.0.0
ioredis@^5.4.0  # Redis client
```

**Alternatives considered:**
- **RabbitMQ** — More complex setup; overkill for our job queue needs; BullMQ is simpler and sufficient
- **Amazon SQS** — Cloud vendor lock-in; we need self-hosted option for on-premise deployments
- **Bee-Queue** — Less active development; BullMQ has better features and community

---

### 2.8 Logging & Monitoring: Winston + OpenTelemetry

**Why:** Winston provides structured JSON logging with file rotation and multiple transports. OpenTelemetry provides distributed tracing across services (critical for microservices architecture in later phases).

**Version:** winston@^3.17.0

**Key dependencies:**
```
winston@^3.17.0
nest-winston@^1.9.0
@opentelemetry/api@^1.9.0
@opentelemetry/sdk-node@^0.56.0
```

---

## 3. DATABASE

### 3.1 Primary Database: PostgreSQL 16+

**Why:** PostgreSQL is the gold standard for enterprise relational data. Supports complex queries needed for payroll calculations, attendance aggregations, and analytics. JSONB columns for flexible custom fields. Row-level security for multi-tenant data isolation.

**Version:** PostgreSQL 16.x

**Key features leveraged:**
- JSONB for custom employee fields and flexible configurations
- Row-Level Security (RLS) for multi-tenant data isolation
- Full-text search for employee/candidate search
- Partitioning for large tables (attendance logs, audit trails)
- Materialized views for dashboard aggregations
- Recursive CTEs for organizational hierarchy queries

**Alternatives considered:**
- **MySQL 8** — Good but lacks advanced features like JSONB operators, CTEs are less mature
- **MongoDB** — Schema flexibility is tempting for custom fields, but HRM data is highly relational; payroll requires ACID guarantees
- **SQLite** — Not suitable for production multi-tenant workloads

---

### 3.2 Cache: Redis 7.x

**Why:** Redis serves multiple roles: session storage, API response caching, rate limiting, BullMQ backend, and real-time pub/sub for notifications. Single infrastructure component solving multiple concerns.

**Version:** Redis 7.2+

**Key usage patterns:**
- Session storage for JWT blacklists
- API response caching (dashboard data, org charts)
- Rate limiting (login attempts, API calls)
- BullMQ job queue backend
- Pub/Sub for real-time notifications
- Leader election for distributed cron jobs

**Alternatives considered:**
- **Memcached** — Simpler but lacks data structures (lists, sets, sorted sets) needed for queues and rate limiting
- **KeyDB** — Drop-in Redis replacement with multi-threading; considered for future scaling if Redis becomes bottleneck

---

### 3.3 File Storage: Local (dev) + MinIO / S3-compatible (prod)

**Why:** MinIO provides S3-compatible API for self-hosted deployments. Employee documents, resumes, profile photos, and payslip PDFs require reliable object storage. S3 compatibility allows easy migration to AWS S3, Cloudflare R2, or DigitalOcean Spaces.

**Key dependencies:**
```
@aws-sdk/client-s3@^3.700.0  # S3 client (works with MinIO)
multer@^2.0.0  # File upload middleware
multer-s3@^3.0.1  # Direct S3 upload
```

**Storage strategy:**
- Development: Local filesystem
- Staging: MinIO (self-hosted S3)
- Production: AWS S3 / Cloudflare R2 / MinIO (customer choice)

---

## 4. INFRASTRUCTURE

### 4.1 Containerization: Docker + Docker Compose

**Why:** Docker ensures consistent environments across dev, staging, and production. Docker Compose orchestrates all services (PostgreSQL, Redis, backend, frontend, MinIO, Nginx) for local development.

**Services in docker-compose.yml:**
```
- postgres:16-alpine
- redis:7-alpine
- backend (NestJS)
- frontend (Vite dev server / Nginx prod)
- minio (S3-compatible storage)
- nginx (reverse proxy)
```

---

### 4.2 Reverse Proxy: Nginx

**Why:** Nginx handles SSL termination, load balancing, gzip compression, static file serving, and API routing. battle-tested with excellent performance.

**Key configuration:**
- SSL/TLS termination
- Gzip/Brotli compression
- Static file caching for frontend assets
- API proxy to NestJS backend
- Rate limiting at proxy level
- WebSocket support for real-time notifications

---

### 4.3 External Access: Cloudflare Tunnel

**Why:** Cloudflare Tunnel (cloudflared) provides secure, zero-trust access without opening inbound ports. Eliminates need for public IP management. Includes built-in DDoS protection, WAF, and CDN.

**Key dependencies:**
```
cloudflared (latest)
```

**Alternatives considered:**
- **ngrok** — Good for dev but paid for production features; Cloudflare Tunnel is free
- **LocalTunnel** — Unreliable; not production-ready
- **WireGuard + reverse proxy** — More complex setup; Cloudflare provides security features out-of-the-box

---

### 4.4 Monitoring & Observability

**Stack:**
- **Prometheus** — Metrics collection (CPU, memory, request rates, error rates)
- **Grafana** — Dashboard visualization
- **Sentry** — Error tracking (frontend + backend)
- **Uptime Kuma** — Uptime monitoring and alerting

---

## 5. DEVELOPMENT TOOLS

### 5.1 Linting & Formatting: ESLint + Prettier

**Why:** ESLint catches code quality issues; Prettier ensures consistent formatting. Combined with TypeScript parser for full type-aware linting.

**Version:** eslint@^9.15.0, prettier@^3.4.0

**Key dependencies:**
```
eslint@^9.15.0
@eslint/js@^9.15.0
typescript-eslint@^8.15.0
prettier@^3.4.0
eslint-config-prettier@^9.1.0
eslint-plugin-react@^7.37.0
eslint-plugin-react-hooks@^5.1.0
eslint-plugin-jsx-a11y@^6.10.0
eslint-plugin-import@^2.31.0
eslint-plugin-unicorn@^56.0.0  # Best practice rules
```

---

### 5.2 Git Hooks: Husky + lint-staged

**Why:** Husky runs pre-commit hooks to enforce code quality before commits. lint-staged only lints changed files for speed.

**Version:** husky@^9.1.0, lint-staged@^15.2.0

**Key dependencies:**
```
husky@^9.1.0
lint-staged@^15.2.0
```

**Pre-commit pipeline:**
1. lint-staged → ESLint + Prettier on staged files
2. Type check (tsc --noEmit) on staged files
3. Commit message validation via commitlint

---

### 5.3 Commit Convention: Commitlint + Conventional Commits

**Why:** Enforces consistent commit messages (feat:, fix:, chore:, etc.) enabling automatic changelog generation and semantic versioning.

**Version:** @commitlint/cli@^19.6.0

**Key dependencies:**
```
@commitlint/cli@^19.6.0
@commitlint/config-conventional@^19.6.0
```

---

### 5.4 CI/CD: GitHub Actions

**Why:** Native GitHub integration, free for public repos, generous free tier for private repos. Supports matrix builds, caching, and deployment workflows.

**Pipeline stages:**
1. **Lint & Type Check** — ESLint, Prettier, tsc --noEmit
2. **Test** — Vitest (frontend), Jest (backend) with coverage
3. **Build** — Vite build (frontend), NestJS build (backend)
4. **Security Scan** — npm audit, Trivy (Docker image scan)
5. **Deploy** — Docker build + push, Cloudflare Tunnel deployment

---

### 5.5 Package Manager: pnpm

**Why:** pnpm is faster than npm/yarn, uses hard links for disk efficiency (critical for monorepo), and has strict dependency resolution preventing phantom dependencies.

**Version:** pnpm@^9.15.0

---

## 6. FUTURE CONSIDERATIONS

### 6.1 Mobile App: React Native (Expo)

**Why:** Code sharing with web frontend (hooks, API client, state management, types). Expo provides managed workflow with OTA updates.

**Version:** Expo SDK 52+, React Native 0.76+

### 6.2 AI/ML Microservice: Python + FastAPI

**Why:** Python ecosystem dominates ML/AI. FastAPI provides async API with auto-generated docs. Communicates with NestJS via REST or message queue.

**Key dependencies:**
```
fastapi@^0.115.0
scikit-learn@^1.6.0
pandas@^2.2.0
python-dotenv@^1.0.0
```

### 6.3 Search: Meilisearch (MVP) → Elasticsearch (Scale)

**Why:** Meilisearch provides typo-tolerant, fast full-text search with simple setup. Suitable for MVP employee/candidate search. Migrate to Elasticsearch when scale demands advanced aggregation and custom analyzers.

### 6.4 GraphQL: Apollo Federation (Phase 3+)

**Why:** Product vision calls for GraphQL support. Apollo Federation enables gradual migration from REST to GraphQL without breaking existing clients.

---

## 7. COMPLETE DEPENDENCY SUMMARY

### Frontend (package.json)
```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router": "^7.1.0",
    "react-router-dom": "^7.1.0",
    "antd": "^5.22.0",
    "@ant-design/icons": "^5.5.0",
    "@ant-design/pro-components": "^2.7.0",
    "zustand": "^4.5.0",
    "@tanstack/react-query": "^5.60.0",
    "react-hook-form": "^7.54.0",
    "zod": "^3.24.0",
    "@hookform/resolvers": "^3.9.0",
    "axios": "^1.7.0",
    "axios-retry": "^4.5.0",
    "echarts": "^5.5.0",
    "echarts-for-react": "^3.0.2",
    "recharts": "^2.15.0",
    "tailwindcss": "^4.0.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.6.0",
    "dayjs": "^1.11.13",
    "lodash-es": "^4.17.21",
    "file-saver": "^2.0.5",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "vite": "^6.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.4.0",
    "vitest": "^2.1.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/user-event": "^14.5.0",
    "jsdom": "^25.0.0",
    "@playwright/test": "^1.49.0",
    "eslint": "^9.15.0",
    "prettier": "^3.4.0",
    "husky": "^9.1.0",
    "lint-staged": "^15.2.0",
    "@commitlint/cli": "^19.6.0",
    "@commitlint/config-conventional": "^19.6.0"
  }
}
```

### Backend (package.json)
```json
{
  "dependencies": {
    "@nestjs/core": "^11.0.0",
    "@nestjs/common": "^11.0.0",
    "@nestjs/platform-express": "^11.0.0",
    "@nestjs/jwt": "^11.0.0",
    "@nestjs/passport": "^11.0.0",
    "@nestjs/swagger": "^11.0.0",
    "@nestjs/throttler": "^6.0.0",
    "@nestjs/bullmq": "^11.0.0",
    "@nestjs/schedule": "^5.0.0",
    "@nestjs/config": "^4.0.0",
    "@nestjs/terminus": "^11.0.0",
    "@nestjs/testing": "^11.0.0",
    "prisma": "^6.0.0",
    "@prisma/client": "^6.0.0",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "passport-local": "^1.0.0",
    "passport-oauth2": "^1.8.0",
    "@node-saml/passport-saml": "^4.0.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "bullmq": "^5.30.0",
    "ioredis": "^5.4.0",
    "winston": "^3.17.0",
    "nest-winston": "^1.9.0",
    "bcrypt": "^5.1.1",
    "@aws-sdk/client-s3": "^3.700.0",
    "multer": "^2.0.0",
    "multer-s3": "^3.0.1",
    "rxjs": "^7.8.0",
    "reflect-metadata": "^0.2.2",
    "dayjs": "^1.11.13",
    "uuid": "^11.0.0",
    "pdf-lib": "^1.17.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.0",
    "@nestjs/schematics": "^11.0.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.2.0",
    "supertest": "^7.0.0",
    "typescript": "^5.4.0",
    "eslint": "^9.15.0",
    "prettier": "^3.4.0",
    "husky": "^9.1.0",
    "lint-staged": "^15.2.0",
    "@commitlint/cli": "^19.6.0",
    "@commitlint/config-conventional": "^19.6.0",
    "source-map-support": "^0.5.21",
    "ts-loader": "^9.5.0",
    "ts-node": "^10.9.0",
    "tsconfig-paths": "^4.2.0"
  }
}
```

---

## 8. ARCHITECTURE COMPATIBILITY MATRIX

| Technology | Multi-tenant | RBAC | Scalability | TypeScript | Enterprise Ready |
|-----------|:-----------:|:----:|:-----------:|:----------:|:----------------:|
| React 19 + TS | Yes | Yes | Yes | Native | Yes |
| Ant Design 5 | Yes | Yes | Yes | Full | Yes |
| Zustand + RQ | Yes | Yes | Yes | Full | Yes |
| NestJS 11 | Yes | Yes | Yes | Native | Yes |
| Prisma 6 | Yes | Yes | Yes | Full | Yes |
| PostgreSQL 16 | Yes | Yes | Yes | - | Yes |
| Redis 7 | Yes | Yes | Yes | - | Yes |
| BullMQ 5 | Yes | Yes | Yes | Full | Yes |
| Docker | Yes | - | Yes | - | Yes |

---

## 9. VERSION LOCK FILE STRATEGY

- **pnpm-lock.yaml** committed to version control for reproducible builds
- Weekly Dependabot PRs for patch/minor updates
- Major version upgrades evaluated quarterly
- Critical security patches applied within 24 hours
