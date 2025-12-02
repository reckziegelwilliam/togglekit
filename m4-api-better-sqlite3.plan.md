# M4 - API Service Implementation (better-sqlite3)

## Overview

Build the backend API service using **better-sqlite3** instead of Prisma for maximum simplicity, performance, and control. Maintains robust type safety through comprehensive TypeScript interfaces and type guards.

## Why better-sqlite3?

- **Simpler**: No code generation, no schema files, just SQL
- **Faster**: Synchronous API, no async overhead
- **Lighter**: ~1MB vs Prisma's ~3MB
- **More Control**: Direct SQL access, explicit queries
- **Perfect for self-hosted**: SQLite is ideal for single-server deployments

## Type Safety Strategy

Instead of Prisma's generated types, we'll use:
1. **Explicit TypeScript interfaces** for all database models
2. **Type-safe query builders** using prepared statements
3. **Runtime validation** for query results
4. **Branded types** for IDs to prevent mixing
5. **Zod schemas** for JSON config validation

## Core Components

### 1. Database Types (`src/db/types.ts`)

```typescript
// Branded types for type safety
export type ProjectId = string & { readonly __brand: 'ProjectId' };
export type EnvironmentId = string & { readonly __brand: 'EnvironmentId' };
export type FlagId = string & { readonly __brand: 'FlagId' };
export type ApiKey = string & { readonly __brand: 'ApiKey' };

// Database row types (matches SQLite schema exactly)
export interface ProjectRow {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface EnvironmentRow {
  id: string;
  name: string;
  api_key: string;
  project_id: string;
  created_at: string;
  updated_at: string;
}

export interface FlagRow {
  id: string;
  key: string;
  config: string; // JSON string
  env_id: string;
  created_at: string;
  updated_at: string;
}

// Domain types (converted from rows)
export interface Project {
  id: ProjectId;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Environment {
  id: EnvironmentId;
  name: string;
  apiKey: ApiKey;
  projectId: ProjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface Flag {
  id: FlagId;
  key: string;
  config: string;
  envId: EnvironmentId;
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. Database Client (`src/db/client.ts`)

Type-safe wrapper around better-sqlite3 with prepared statements:

```typescript
import Database from 'better-sqlite3';

export class DatabaseClient {
  private db: Database.Database;
  
  // Prepared statements (compiled once, reused)
  private statements: {
    findEnvironmentByApiKey: Database.Statement<[string]>;
    findFlagsByEnvId: Database.Statement<[string]>;
    createFlag: Database.Statement<[string, string, string, string]>;
    // ... etc
  };

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.prepareStatements();
  }

  // Type-safe query methods
  findEnvironmentByApiKey(apiKey: string): Environment | null {
    const row = this.statements.findEnvironmentByApiKey.get(apiKey);
    return row ? this.mapEnvironmentRow(row as EnvironmentRow) : null;
  }

  // Type conversions with validation
  private mapEnvironmentRow(row: EnvironmentRow): Environment {
    return {
      id: row.id as EnvironmentId,
      name: row.name,
      apiKey: row.api_key as ApiKey,
      projectId: row.project_id as ProjectId,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
```

### 3. Migration System (`src/db/migrations.ts`)

Simple, explicit migrations:

```typescript
export interface Migration {
  version: number;
  name: string;
  up: string; // SQL to apply
  down: string; // SQL to rollback
}

export const migrations: Migration[] = [
  {
    version: 1,
    name: 'initial_schema',
    up: `
      CREATE TABLE projects (...);
      CREATE TABLE environments (...);
      CREATE TABLE flags (...);
    `,
    down: `
      DROP TABLE flags;
      DROP TABLE environments;
      DROP TABLE projects;
    `,
  },
];

export function runMigrations(db: Database.Database): void {
  // Check current version, run pending migrations
}
```

### 4. Query Builders (`src/db/queries.ts`)

Type-safe query builders for complex operations:

```typescript
export class FlagQueries {
  constructor(private db: Database.Database) {}

  findByEnvId(envId: EnvironmentId): Flag[] {
    const stmt = this.db.prepare(`
      SELECT * FROM flags WHERE env_id = ? ORDER BY created_at DESC
    `);
    const rows = stmt.all(envId) as FlagRow[];
    return rows.map(mapFlagRow);
  }

  create(data: {
    key: string;
    config: string;
    envId: EnvironmentId;
  }): Flag {
    const id = crypto.randomUUID();
    const stmt = this.db.prepare(`
      INSERT INTO flags (id, key, config, env_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    
    stmt.run(id, data.key, data.config, data.envId);
    
    // Return created flag
    return this.findById(id as FlagId)!;
  }
}
```

### 5. Validation Layer (`src/db/validation.ts`)

Runtime validation using Zod:

```typescript
import { z } from 'zod';
import { Flag as FlagType } from '@togglekit/flags-core-ts';

export const FlagConfigSchema = z.object({
  key: z.string(),
  defaultValue: z.union([z.boolean(), z.string()]),
  rules: z.array(z.any()).optional(),
  variants: z.array(z.any()).optional(),
  description: z.string().optional(),
});

export function validateFlagConfig(config: string): FlagType {
  const parsed = JSON.parse(config);
  return FlagConfigSchema.parse(parsed);
}
```

## Implementation Order

1. **Remove Prisma** - Delete schema, migrations, client
2. **Add better-sqlite3** - Install package and types
3. **Create type system** - Comprehensive interfaces
4. **Create DB client** - Type-safe wrapper
5. **Create migrations** - Simple SQL-based system
6. **Create query builders** - For each entity
7. **Update auth middleware** - Use typed queries
8. **Update routes** - All endpoints with type safety
9. **Update tests** - In-memory SQLite testing
10. **Verify & test** - Build, run tests, manual testing

## Dependencies

```json
{
  "dependencies": {
    "@togglekit/flags-core-ts": "workspace:*",
    "fastify": "^4.25.2",
    "@fastify/cors": "^8.5.0",
    "better-sqlite3": "^9.2.2",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.8",
    "@types/node": "^20.11.0",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1"
  }
}
```

## Benefits Over Prisma

1. ✅ **Simpler** - No schema files, no generation
2. ✅ **Faster** - Synchronous, no overhead
3. ✅ **Explicit** - See exactly what SQL runs
4. ✅ **Lighter** - Smaller bundle
5. ✅ **Full Control** - Direct SQL access
6. ✅ **Type Safe** - Comprehensive TypeScript types
7. ✅ **No Magic** - Everything is explicit

## Type Safety Guarantee

Every database interaction is typed:
- ✅ Query inputs validated
- ✅ Query outputs typed
- ✅ IDs are branded types (can't mix ProjectId with FlagId)
- ✅ Dates properly converted
- ✅ JSON configs validated with Zod
- ✅ No `any` types in production code

