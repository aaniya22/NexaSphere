# NexaSphere Rate Limiting — Implementation TODO

## Phase 1-2: Discovery & Endpoint Inventory
- [ ] Read all route mounts in `server/index.js` and `server/routes/*.js`.
- [ ] Identify auth/admin/user/form/search/upload/webhook endpoints.
- [ ] Produce Tier 1-4 endpoint classification matrix.

## Phase 3-4: Strategy + Tech Selection
- [ ] Decide concrete algorithms/keys for: IP, user, route, role (admin).
- [ ] Decide how to use Redis vs Upstash Redis (when `UPSTASH_REDIS_REST_URL` is set).
- [ ] Document configurable limits per tier.

## Phase 5-10: Centralized Global Rate Limiting Implementation
- [ ] Implement unified rate limit middleware module in `server/middleware/`.
- [ ] Implement Redis-backed atomic counters using existing `rate-limit-redis` + `ioredis`.
- [ ] Standardize 429 payload and required headers (`Retry-After`, `X-RateLimit-*`).
- [ ] Preserve existing functionality by carefully integrating middleware into current routes.

## Phase 6: Middleware Integration
- [ ] Ensure composite keys: IP + route + (user/admin role when available).
- [ ] Ensure proxy/IP handling correctness with `trust proxy`.

## Phase 7-9: Authentication & Bot/Abuse Hardening
- [ ] Tighten login/admin login and password reset endpoints with progressive restrictions.
- [ ] Add anti-credential-stuffing protections via targeted identity keys.
- [ ] Add per-route quotas for abusive endpoints.

## Phase 11-14: UX, Accessibility, Performance
- [ ] Ensure 429 responses are consistent and safe for UI consumption.
- [ ] Ensure no SSR/CSR regressions in `website/` and `admin-dashboard/` (if client retries exist).
- [ ] Keep middleware overhead minimal.

## Phase 15-16: Testing
- [ ] Add unit tests for standardized 429 payload/headers.
- [ ] Add tests for Redis-backed counters and composite key behavior.
- [ ] Add abuse simulation tests (brute force / credential stuffing / bot scraping).
- [ ] Run existing test suites; add new tests as needed.

## Phase 17-18: Security, Logging & Monitoring
- [ ] Add structured logging on blocked requests.
- [ ] Ensure no sensitive data leakage.

## Phase 19-20: Vercel + CI/CD Validation
- [ ] Validate `vercel.json` mapping and env vars expectations.
- [ ] Ensure serverless compatibility (no long-running loops; memory fallback bounded).
- [ ] Run lint/typecheck/build/test; ensure GitHub actions pass.

## Phase 21: Documentation
- [ ] Add `docs/guides/RATE_LIMITING.md` with architecture, policies, env vars, troubleshooting, rollback.

## Phase 22: Code Quality Review
- [ ] Ensure zero runtime crashes and no TypeScript/ESLint/build errors.

