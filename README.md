# Togglekit

> A self-hosted feature flag system with a **Rust evaluation engine** and **TypeScript SDKs** for Node and Web.

Togglekit gives you a minimal, modern alternative to heavy SaaS feature flag platforms:

- **Rust core engine** for fast, deterministic flag evaluation
- **TypeScript SDKs** for Node and browser apps
- **API service** for config storage & evaluation
- **Dashboard** for managing flags, rollouts, and test contexts

---

## Status

> ⚠️ Early work in progress – APIs and implementation details may change.

Planned components:

- ✅ TypeScript core evaluator (M2)
- ✅ Node SDK (M3)
- ✅ Web SDK with React hooks (M3)
- ⬜ Rust core engine
- ⬜ Node N-API binding
- ⬜ WASM engine for web
- ⬜ API service & dashboard
- ⬜ CLI

---

## Features (Planned)

- ✨ Boolean and variant flags
- 🧠 Rule-based targeting (attributes like `country`, `plan`, `betaUser`, etc.)
- 🎯 Percentage rollouts (per user, per flag)
- 🧩 Segments & reusable rules (future)
- ⏱ Fast, deterministic evaluation via Rust core
- 🧪 “Test context” UI in dashboard to inspect results & reasons
- 🌐 SDKs for Node and Web (Next.js/RN-friendly)
- 🧱 Self-hosted: run locally or in your own cloud

---

## Monorepo Structure

```txt
.
├─ apps/
│  ├─ api/                 # Flag service (Node/TS)
│  └─ dashboard/           # Admin UI (Next.js)
├─ packages/
│  ├─ flags-core-ts/       # TypeScript evaluator (Phase 1), later wraps Rust
│  ├─ flags-client-node/   # Node SDK
│  └─ flags-client-web/    # Web SDK
├─ crates/
│  ├─ togglekit-core/     # Rust evaluation engine
│  ├─ togglekit-node/     # Node N-API binding
│  └─ togglekit-wasm/     # WASM build for browser
├─ examples/
│  ├─ node-api/            # Example Node integration
│  └─ nextjs-app/          # Example Next.js app using flags
└─ infra/
   ├─ docker-compose.yml   # Local dev stack (API + DB + dashboard)
   └─ db/                  # Migrations, seeds
