# Togglekit – Implementation Plan

A self-hosted feature flag system with:

- **Rust core engine** for rule evaluation (Node + WASM targets)
- **TypeScript SDKs** for Node and Web
- **API service** (Node/TS) for config storage & evaluation
- **Dashboard** (Next.js) for managing flags and testing rules

---

## Milestones

1. [ ] **M1 – Monorepo & Tooling**
2. [ ] **M2 – TypeScript Core Evaluator**
3. [ ] **M3 – Node & Web SDKs (TS-only)**
4. [ ] **M4 – API Service (Node/TS)**
5. [ ] **M5 – Dashboard (Next.js)**
6. [ ] **M6 – Rust Core Engine**
7. [ ] **M7 – Node N-API Binding**
8. [ ] **M8 – WASM Engine & Web SDK Integration**
9. [ ] **M9 – CLI, DX Polish & Examples**

---

## M1 – Monorepo & Tooling

**Goal:** Set up the basic repo structure, workspace tooling, and CI skeleton.

### Tasks

- [ ] Initialize git repo (`togglekit`)
- [ ] Add root `package.json` with workspaces:
  - `apps/*`
  - `packages/*`
- [ ] Add Turborepo (or Nx) for orchestration
  - [ ] `pnpm add -D turbo typescript eslint`
- [ ] Create base directories:
  - [ ] `apps/api`
  - [ ] `apps/dashboard`
  - [ ] `packages/flags-core-ts`
  - [ ] `packages/flags-client-node`
  - [ ] `packages/flags-client-web`
  - [ ] `examples/node-api`
  - [ ] `examples/nextjs-app`
  - [ ] `crates/` (empty for now)
- [ ] Add base scripts in root `package.json`:
  - [ ] `"dev": "turbo dev"`
  - [ ] `"build": "turbo build"`
  - [ ] `"test": "turbo test"`
  - [ ] `"lint": "turbo lint"`
- [ ] Add basic ESLint + TS config shared across packages
- [ ] Add minimal GitHub Actions workflow (placeholder: lint + test)

---

## M2 – TypeScript Core Evaluator (`packages/flags-core-ts`)

**Goal:** Implement the feature flag model and evaluator fully in TS.

### Tasks

- [ ] Define type-safe config model:
  - [ ] `Condition`, `Rule`, `Flag`, `FlagConfig`, `Context`
- [ ] Implement condition evaluation:
  - [ ] `eq`, `neq`, `in`, `gt`, `lt`, `contains`
- [ ] Implement stable rollout hashing:
  - [ ] Deterministic hash: `(userId + flagKey) → 0..100`
  - [ ] Export helper `computeRolloutBucket(userId, flagKey)` for test parity later
- [ ] Implement `Evaluator`:
  - [ ] `evalBool(flagKey, context) → { value, reason }`
  - [ ] `evalVariant(flagKey, context) → { value, reason }`
- [ ] Add unit tests:
  - [ ] Simple on/off flags
  - [ ] Multi-condition rules
  - [ ] Percentage rollouts
  - [ ] Missing/malformed context handling
- [ ] Add JSON fixtures for cross-language parity:
  - [ ] `fixtures/case-basic.json`
  - [ ] `fixtures/case-rollout.json`
  - [ ] `fixtures/case-variants.json`

---

## M3 – Node & Web SDKs (TS-only)

### Node SDK (`packages/flags-client-node`)

**Goal:** Ergonomic Node client backed by the TS evaluator.

- [ ] Define public API:
  - [ ] `createFlagClient(options): Promise<FlagClient>`
  - [ ] `FlagClient#getBool(flagKey, context)`
  - [ ] `FlagClient#getVariant(flagKey, context)`
- [ ] Implement config fetching:
  - [ ] `fetchConfig` using API key (calls `apps/api`)
  - [ ] In-memory config cache
  - [ ] Periodic refresh (configurable interval)
- [ ] Wire to TS `Evaluator`
- [ ] Handle failure modes:
  - [ ] No config yet → defaults
  - [ ] Network errors
- [ ] Add tests:
  - [ ] Mocked `fetchConfig`
  - [ ] Refresh behavior
  - [ ] Basic evaluation path

### Web SDK (`packages/flags-client-web`)

**Goal:** Browser-oriented client using TS evaluator.

- [ ] Define API:
  - [ ] `createFlagClient(options): FlagClient | Promise<FlagClient>`
  - [ ] Optional `bootstrapConfig` (SSR)
  - [ ] Optional `fetchConfig`
- [ ] Implement:
  - [ ] Immediate bootstrap from inline config
  - [ ] Optional async refresh in background
- [ ] Wire to TS `Evaluator`
- [ ] Add simple React helper:
  - [ ] `useFlag(flagKey, context)`
- [ ] Add tests for:
  - [ ] Bootstrap-only mode
  - [ ] Fetch mode

---

## M4 – API Service (Node/TS) (`apps/api`)

**Goal:** Provide CRUD for flags & serve config snapshots.

### Tasks

- [ ] Choose framework: Express/Fastify/Next API routes
- [ ] Add DB layer (e.g. Prisma + Postgres or SQLite for dev)
- [ ] Define DB schema:
  - [ ] `Project` (id, name, apiKey)
  - [ ] `Env` (id, name, projectId)
  - [ ] `Flag` (id, key, envId, config JSON)
- [ ] Implement auth middleware:
  - [ ] Resolve `project` & `env` from `apiKey` + query
- [ ] Routes:
  - [ ] `GET /v1/config` → `FlagConfig`
  - [ ] `GET /v1/flags`
  - [ ] `POST /v1/flags`
  - [ ] `PUT /v1/flags/:id`
  - [ ] `POST /v1/evaluate` (optional)
- [ ] Integration tests:
  - [ ] Config retrieval
  - [ ] Basic CRUD
  - [ ] Evaluate endpoint using TS `Evaluator`

---

## M5 – Dashboard (Next.js) (`apps/dashboard`)

**Goal:** Basic admin UI for managing projects, environments, and flags.

### Tasks

- [ ] Create Next.js app with routing:
  - [ ] `/projects`
  - [ ] `/projects/:projectId/envs/:envId/flags`
  - [ ] `/projects/:projectId/envs/:envId/flags/:flagId`
  - [ ] `/projects/:projectId/envs/:envId/test`
- [ ] Implement:
  - [ ] Project + env selector
  - [ ] Flag list (table)
  - [ ] Flag editor (variants, rules, rollouts)
  - [ ] “Test flag” screen:
    - [ ] JSON editor for context
    - [ ] Flag dropdown
    - [ ] Evaluate button → result + reason
- [ ] Use TS `Evaluator` in-browser for test mode
- [ ] Add minimal auth (even static/demo login is fine for v1)
- [ ] Apply basic polished UI (consistent typography, spacing, dark mode)

---

## M6 – Rust Core Engine (`crates/togglekit-core`)

**Goal:** Port the evaluator logic to Rust with identical behavior.

### Tasks

- [ ] Initialize Rust workspace:
  - [ ] Root `Cargo.toml` with `[workspace]`
- [ ] Create `crates/togglekit-core`:
  - [ ] Define Rust equivalents of `Condition`, `Rule`, `Flag`, `FlagConfig`, `Context`
- [ ] Implement:
  - [ ] Condition evaluation matching TS semantics
  - [ ] Rollout hashing identical to TS `computeRolloutBucket`
  - [ ] `Evaluator::from_config(config)`
  - [ ] `Evaluator::eval_bool(flag_key, ctx)`
  - [ ] `Evaluator::eval_variant(flag_key, ctx)`
- [ ] Add Rust tests using same fixtures as TS:
  - [ ] Parse JSON fixtures from `fixtures/`
  - [ ] Assert same outputs as TS tests
- [ ] Ensure serde-based (de)serialization from JSON works as expected

---

## M7 – Node N-API Binding (`crates/togglekit-node`)

**Goal:** Expose Rust evaluator to Node via N-API.

### Tasks

- [ ] Create `crates/togglekit-node` using `napi-rs` (or chosen N-API framework)
- [ ] Implement `JsEvaluator`:
  - [ ] `from_config(config: JsUnknown) -> JsEvaluator`
  - [ ] `eval_bool(flag_key: String, ctx: JsUnknown) -> JsObject`
  - [ ] `eval_variant(flag_key: String, ctx: JsUnknown) -> JsObject`
- [ ] Add node/gyp / napi build tooling
- [ ] Create npm wrapper package:
  - [ ] `packages/flags-engine-node/`
  - [ ] Re-export `JsEvaluator` for TS land
- [ ] Integration tests:
  - [ ] Load native module from Node
  - [ ] Evaluate test config + context → matches TS expectations

### Swap Node SDK

- [ ] Update `flags-client-node`:
  - [ ] Use `flags-engine-node` instead of `flags-core-ts` for evaluation
  - [ ] Keep public API unchanged
  - [ ] Optional: env flag to force TS evaluator fallback in dev

---

## M8 – WASM Engine & Web SDK Integration (`crates/togglekit-wasm`)

**Goal:** Use same Rust core in the browser via WASM.

### Tasks

- [ ] Create `crates/togglekit-wasm`:
  - [ ] Depend on `togglekit-core` and `wasm-bindgen`
  - [ ] Implement `WasmEvaluator` with `new(config_json: &str)`
  - [ ] Methods:
    - [ ] `eval_bool(flag_key: &str, ctx_json: &str)`
    - [ ] `eval_variant(flag_key: &str, ctx_json: &str)`
- [ ] Build JS bindings with `wasm-pack` (or equivalent)
- [ ] Create npm wrapper:
  - [ ] `packages/flags-engine-wasm/`
  - [ ] `createWasmEvaluator(config: FlagConfig)`
- [ ] Update `flags-client-web`:
  - [ ] Swap TS evaluator for WASM evaluator
  - [ ] Adjust `createFlagClient` to async if needed
  - [ ] Keep external API as close as possible to previous version

---

## M9 – CLI, DX Polish, and Examples

### CLI (Rust)

- [ ] Create `crates/togglekit-cli`:
  - [ ] `togglekit validate <config.json>`
  - [ ] `togglekit eval --flag <key> --context ctx.json --config config.json`
- [ ] Use `togglekit-core` internally

### Examples

- [ ] `examples/node-api`:
  - [ ] Simple Node/Express app using `flags-client-node`
- [ ] `examples/nextjs-app`:
  - [ ] Next.js app using `flags-client-web` (SSR + client)
  - [ ] Example flags: `new-onboarding`, `pricing-page-layout`

### DX & Docs

- [ ] Polish `README.md` (see template)
- [ ] Add `docs/architecture.md` with diagram(s)
- [ ] Add contribution guidelines:
  - [ ] `CONTRIBUTING.md`
- [ ] Final CI pass:
  - [ ] TS: lint, test, build
  - [ ] Rust: fmt, clippy, test
