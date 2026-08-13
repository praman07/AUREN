# AUREN Universal Knowledge Core — Backend MVP Audit

**Date:** 2026-08-12
**Status:** Completed — no code was modified during this audit.
**Method:** Full source trace of the real execution paths (request → auth → controller → service → database/vector store → response). Claims were verified against code, not against test-script existence or log files.

---

## 1. What Is Genuinely Working

| # | Area | Evidence (file:line) | Verdict |
|---|------|----------------------|---------|
| 1 | TypeScript compilation | `npx tsc --noEmit` runs clean (verified) | WORKING |
| 2 | Prisma schema | `server/prisma/schema.prisma` — multi-tenant models, RBAC, policy lists on Document, Session, APIKey, AuditLog, ConnectedAccount, chunks | WORKING |
| 3 | Document upload → persistence | `UploadService.processUpload` (server/src/application/services/UploadService.ts:22) — storage write, DB tx (Document + DocumentVersion + AuditLog), event dispatch via `LocalEventPublisher` → `DocumentProcessingOrchestrator.startPipeline` (server/src/application/services/DocumentProcessingOrchestrator.ts:46) | WORKING |
| 4 | Chunking | `ChunkingService.processDocument` (server/src/application/services/ChunkingService.ts:14) — reads `.txt` blob from storage, `ChunkStrategy.generateChunks`, persists chunks in tx | WORKING |
| 5 | Embedding | `EmbeddingService.processDocument` (server/src/application/services/EmbeddingService.ts:12) — `AIGateway.embed` → `OllamaEmbeddingProvider` (`/api/embed`, nomic-embed-text), writes `vectorData` | WORKING |
| 6 | Qdrant indexing | `QdrantIndexingService.processDocument` (server/src/application/services/QdrantIndexingService.ts:12) — `ensureCollection`, batched upsert, state + audit | WORKING (w/ security gap, see §2) |
| 7 | Vector search | `VectorSearchProvider.search` → `PermissionFilter.buildVectorFilter` → Qdrant filter query (server/src/infrastructure/search/VectorSearchProvider.ts:11) | WORKING (w/ metadata bug, see §2) |
| 8 | RAG / chat stream | `RAGService.streamChat` (server/src/application/services/RAGService.ts:25) — SSE events, conversation org check, permission-filtered retrieval, history merge, Ollama streaming, audit | WORKING |
| 9 | Zero-trust permission predicate | `PermissionFilter` (server/src/infrastructure/search/PermissionFilter.ts) — org MUST, deny MUST_NOT (user/role/department), allow SHOULD — Deny-Wins semantics | WORKING (as a predicate; enforcement depends on data correctness §2) |
| 10 | Super Admin domain logic | `SuperAdminService` (server/src/domain/security/SuperAdminService.ts) — roles, departments, assignments, policy lists, `propagatePolicyToQdrant` | WORKING (no HTTP surface, see §3.9) |
| 11 | Real connectors | `GitHubConnector` / `GmailConnector` / `NotionConnector` (server/src/infrastructure/connectors/*) call real external APIs | WORKING (not registered at runtime, see §3.6) |
| 12 | HTTP middleware stack | helmet, cors, json limits, cookieParser, global rate limit, pino request logger, zod `validateRequest`, `errorHandler` (server/src/app.ts:23-56) | WORKING |
| 13 | Encryption helper | `EncryptionService` AES-256-GCM (server/src/application/services/EncryptionService.ts) | WORKING (dev key fallback, see §13) |

## 2. What Only Exists As Isolated Code / Tests

| Item | Reality |
|------|---------|
| **BM25 / hybrid search** | `BM25SearchProvider.search` returns `[]` unconditionally (server/src/infrastructure/search/BM25SearchProvider.ts:8) — the lexical half of hybrid retrieval is fake. |
| **Security "regression tests"** | ~15 scripts under `server/src/scripts/*` run directly against Postgres/Qdrant/Ollama with **mocked orchestrators** (`orchestratorMock = { handleEvent: async () => {} }`). They are **not HTTP tests** and are not wired into any runner. Saved outputs (`server/master_output.txt`, `server/test_output.log`) show FAILs (Embedding, Permission Filter, Security Isolation) and 17 SKIPPED — the "passing regression tests" claim is not reproducible. |
| **Unit tests** | `__tests__/*.test.ts` use `jest` which is **not installed** (no jest in package.json, no `test` script; `**/*.test.ts` excluded from tsconfig). They cannot run. |
| **Clerk auth** | `ClerkExpressWithAuth` + `requireAuth` exists, but no Clerk keys are configured; there is a `DEV_AUTH_MOCK` that trusts any base64-decoded JWT (server/src/presentation/middlewares/requireAuth.ts:42-52). |
| **SessionService / PermissionService / OrganizationService / GroupService / InvitationService** | Empty class shells (constructor only). |
| **Qdrant policy propagation at index time** | The `QdrantIndexingService` payload contains only `organizationId, departmentId, visibility, ownerId, documentId, versionId, chunkId, pageNumbers, sectionTitle, chunkIndex, text, createdAt, updatedAt` (server/src/application/services/QdrantIndexingService.ts:75-92). **The six allow/deny policy arrays are absent** — they're only written later by `SuperAdminService.propagatePolicyToQdrant`. Chunks ingested before a policy update cannot be denied by role/user/department lists at query time. |
| **Connector registry** | `ConnectorRegistry.getInstance().register(...)` happens **only inside scripts** (e.g. server/src/scripts/test_github_e2e.ts:15-16). The runtime `di.ts` never registers connectors → production `syncConnectedAccount` throws `No connector registered for provider`. |
| **Frontend** | Large portions are mock state: `MockClerkProvider`, `security.mock.ts`, `users.mock.ts`, `organizations.mock.ts`, hardcoded Memory Console stats, `ConnectorsList` local state. |

## 3. Missing HTTP Endpoints

| Endpoint family | Status |
|-----------------|--------|
| `POST /api/v1/auth/login` | Missing |
| `POST /api/v1/auth/logout` | Missing (Session model exists; SessionService is empty) |
| `GET /api/v1/auth/me` | Exists (server/src/presentation/routes/authRoutes.ts:6) |
| `GET/POST/PATCH/DELETE /api/v1/connectors...` | **Entire family missing** — no connector routes file exists at all |
| `POST /api/v1/connectors/:id/sync` | Missing |
| Super Admin routes (`/super-admin/roles|departments|documents/:id/policy|...`) | **Exist but never mounted** — `superAdminRoutes.ts` is not imported by `app.ts` (server/src/app.ts:44-53). Any `POST /api/v1/super-admin/...` returns 404. |
| Organizations management | Missing (no org controller/service) |
| Invitation accept/reject | Missing |
| Groups management | Missing |
| API keys management | Missing |
| Session restore / logout all devices | Missing |

## 4. Missing Authentication Flows

- No password/session lifecycle at all: authentication is limited to (a) Clerk JWT when keys are configured, or (b) the `DEV_AUTH_MOCK` base64 bypass.
- No **login**, no **logout/revocation**, no **session expiration handling**, no **current-user contract** beyond `requireAuth` returning `req.user`.
- The `DEV_AUTH_MOCK` path (server/src/presentation/middlewares/requireAuth.ts:42) decodes **any** JWT-shaped base64 payload and trusts `sub`/`email` without verifying a signature — a complete auth bypass whenever `DEV_AUTH_MOCK=true` (even accidentally in staging).
- `requireAuth` instantiates its own `new PrismaClient()` (requireAuth.ts:6) instead of the shared singleton.

## 5. Missing Authorization Enforcement

| Route | Current enforcement | Required |
|-------|--------------------|----------|
| `GET/PATCH/DELETE /api/v1/documents/:id` | Org-ID scoping only (DocumentService) — any employee can read/update/delete **any** org document, incl. `DEPARTMENT`/`PRIVATE` docs of others | owner / explicit-permission / Super Admin checks |
| `GET /api/v1/documents` | Org-scoped list of **all** documents (no visibility/department/deny filter) | permission-filtered list |
| `POST /api/v1/departments`, `PATCH/:id`, `archive`, `restore` | Any authenticated user (TODO comment left in routes/departmentRoutes.ts:19) | Super Admin only |
| `POST /api/v1/users/invite`, `deactivate`, `reactivate` | Any authenticated user (UserController has no role check) | Super Admin only |
| `POST /api/v1/roles/:id/permissions/toggle` | Any authenticated user | Super Admin only |
| `GET /api/v1/audit-logs` | Any authenticated user can read the **full org audit log** | Super Admin (or restricted) |
| `GET /api/v1/jobs` | Any user can see all org processing jobs | Super Admin / owner scoping |
| Cross-tenant writes | Org check is applied on most paths, but SuperAdminService methods (`renameRole`, `deleteRole`, `assignRoleToUser`, `define*Access`, `getRoleUsers`, `assignDepartment`) take **only IDs with no org scoping** — a compromised super admin token of org A can mutate org B rows by ID | org validation in every SA mutation |

## 6. Missing Connector Lifecycle APIs

- No `GET /connectors` (list + status), `POST /connectors/connect`, `POST /connectors/:id/disconnect`, `GET /connectors/:id`, `POST /connectors/:id/sync`, sync status, last successful sync, ingestion error reporting.
- Response contract for connected accounts would leak `accessToken`/`refreshToken` if implemented naively (schema stores both).
- Sync is synchronous in `ConnectorService.syncConnectedAccount`; no job/queue based sync, no per-resource error capture, `ownerId: account.userId || ''` (server/src/application/connectors/ConnectorService.ts:50) can violate the FK when the account is org-scoped.
- Connector-level `allowedUsers/allowedRoles` (already returned by GitHub/Gmail connectors) are **dropped** — `ConnectorService` creates Documents without them (ConnectorService.ts:47-59) → private GitHub repos / private emails become effectively org-wide. **Real leakage path.**
- `hash: 'mock-hash'` written for connector versions (ConnectorService.ts:83) and uploads (UploadService.ts:60).

## 7. Missing Ingestion / Sync APIs

- Upload exists; there is no re-sync trigger, no per-document processing retry endpoint, no way to list per-document pipeline state over HTTP (only jobs list exists).
- `ProcessingJob` model exists and is queried, but no job rows are ever created by the pipeline (the orchestrator transitions a state machine in `PipelineStatusService`; processing jobs written by BullMQ are not persisted to `ProcessingJob`).

## 8. Missing Chat / Search APIs

- `POST /semantic-search/search` exists and works vector-side.
- `POST /chat/stream` exists (SSE).
- Missing: chat history endpoints (`GET /chat`, `GET /chat/:id`, `GET /chat/:id/messages`), search corpora scoping, RAG source citation payload consistency (`sources` event maps `c.metadata?.pageNumbers` but the vector payload stores them flat — sources lose page/section data; `VectorSearchProvider` sets `metadata: r.payload.metadata` which is always `undefined`).
- Chat history stores full document context into `Message.content` (history `take: 10` may exceed model context; minor).

## 9. Missing Super Admin APIs

Routes exist unreachable (see §3). Additionally missing from the controller:
- Validation (no zod on any `superAdminRoutes` handler).
- Org-scope checks (see §5).
- Qdrant propagation on policy update is "simplified" — the controller only calls `define*Access` when the corresponding array is present, and cannot clear a list back to `[]` (`if (allowedRoles || deniedRoles)` skips empty arrays → cannot revoke-all).
- Errors leak internals: `res.status(500).json({ success: false, error: error.message })` everywhere in `SuperAdminController`.

## 10. Missing Audit Logging

| Area | Status |
|------|--------|
| Document create/update/delete | Audit rows written inside UoW (DocumentService) |
| Upload | Written (UploadService) |
| Pipeline states | `PipelineStatusService` writes audit rows |
| RAG chat completion / failure | Written (RAGService:149-172) |
| **Login / logout / failed login** | Missing |
| **Super Admin privilege changes** | Only inside the unreachable SuperAdminController; two different audit paths used inconsistently (`SecurityAuditService.logEvent` vs `AuditLogService` vs direct `prisma.auditLog.create`) |
| **Policy changes** | Never recorded when executed through SuperAdminService directly (only controller-level attempt) |
| **Connector events** (connect/disconnect/sync) | Missing entirely |
| ipAddress / userAgent capture | Schema columns exist, never populated |

## 11. Missing Error Handling

- Controllers split between `next(error)` (Document/SemanticSearch/Upload → centralized `errorHandler`) and inline `try/catch` with raw `error.message` in responses (SuperAdminController, UserController partially, ChatController catch block returns `error.message` to client).
- `ChatController` error handler returns `error.message` to the HTTP client (server/src/presentation/controllers/ChatController.ts:58).
- No 404 handler for unknown routes (`app.use('*')` absent).
- No async-wrapper utility; `errorHandler` treats non-`BaseException` errors as 500 (correct) but `BaseException.statusCode` defaults may leak in dev.

## 12. Missing Validation

- `documentRoutes`, `departmentRoutes`, `roleRoutes`, `auditLogRoutes`, `userRoutes`, `processingJobRoutes` validate via zod.
- **Missing**: `chat/stream` (controller-internal parse is fine but not unified), all Super Admin handlers (zero validation), upload size/type policy (multer default 20MB, no mimetype allow-list), auth endpoints (don't exist), query-parameter coercion (parseInt without validation in DocumentController).

## 13. Missing Rate Limiting / Security Protections

- Global single limiter for `/api` (100 req/15min) — no per-route stricter limits (login brute-force), no separate limits for search/chat (costly paths), no per-IP keying config.
- `helmet()` defaults only (no CSP for the API, no `crossOriginResourcePolicy` tuning).
- `cors` origin is a single string (`env.CORS_ORIGIN`, default `http://localhost:5173`) — Vite dev server actually runs on `:5174` and the client has **no proxy**, so combined they mean the frontend cannot complete any API call.
- No trust proxy config, no request IDs, no body-size policy beyond 10MB.
- `EncryptionService` uses `crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default_insecure_dev_key', ...)` — production must require `ENCRYPTION_KEY`.
- Connector tokens are emitted by naive list endpoints if created without DTO redaction; nothing enforces "secrets never in responses".

## 14. Missing Production Configuration

| Item | Status |
|------|--------|
| Migrations | **No `prisma/migrations` folder** — schema can only be applied via `db push`; a fresh clone cannot `migrate dev`. |
| Seed | `prisma/seed.ts` references `ClearanceLevel`, which no longer exists in schema → `npm run db:seed` crashes at runtime. |
| `db:seed` script | `prisma db seed` expects a `seed` config key — present, but broken script behind it |
| Graceful shutdown | Only HTTP close; no DB/Redis/Qdrant disconnect (server/src/index.ts:22 TODO) |
| Logger | pino exists; no request-id correlation, no log redaction of Authorization headers |
| `.env.example` | Absent (only `.env`) |
| Ollama in compose | Not in `docker-compose.yml` (embedding + chat require a manually running Ollama) |
| CLERK keys / ENCRYPTION_KEY | Not configured; defaults are insecure |

## 15. Recommended Implementation Order

1. **Security-critical data fixes** (cheapest, highest impact):
   - `QdrantIndexingService`: include the six allow/deny policy arrays + visibility/department in every payload.
   - Register GitHub/Gmail/Notion connectors in `di.ts` at startup.
   - `ConnectorService`: apply resource-level `allowedUsers/allowedRoles` to Documents; guarantee valid `ownerId`; real content hash.
2. **Auth foundation**: first-party session auth (login/logout/me/session revocation) with `scrypt` password hashing and the existing `Session` model; rewrite `requireAuth`; remove the unsigned-token bypass.
3. **Authorization enforcement**: document CRUD owner/permission checks, permission-filtered document list, Super-Admin gates on departments/roles/users/audit-logs/jobs, org-scoping inside every SuperAdminService method.
4. **Super Admin HTTP surface**: mount routes, zod schemas, org validation, empty-list clears, Qdrant propagation, audit every change, safe errors.
5. **Connector HTTP lifecycle**: list/connect/disconnect/status/sync/sync-status/ingestion-errors with encrypted token storage and secret-redacted DTOs.
6. **Search completion**: real PostgreSQL BM25 in `BM25SearchProvider` reusing `PermissionFilter.buildSqlFilter`; fix vector search metadata mapping.
7. **Org/User/Invitation flows**: real services, `{success,data}` envelope consistency, invite→role assignment.
8. **Hardening**: per-route rate limits, full validation, audit ipAddress/userAgent, 404 handler, secret redaction, ENCRYPTION_KEY enforcement.
9. **Frontend wiring**: Vite proxy, real auth hooks, replace mock stores (users/orgs/security/connectors/memory), chat SSE parser.
10. **Validation**: `tsc --noEmit`, infra up via docker-compose + Ollama, existing script suite, then `test_mvp_http_e2e.ts` (adversarial HTTP), fix real failures, `docs/MVP_STATUS.md`.