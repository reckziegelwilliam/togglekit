/**
 * Database migration system
 * Simple, explicit SQL migrations with version tracking
 */

import Database from 'better-sqlite3';

export interface Migration {
  version: number;
  name: string;
  up: string;
  down?: string;
}

/**
 * All migrations in order
 */
export const migrations: Migration[] = [
  {
    version: 1,
    name: 'initial_schema',
    up: `
      -- Projects table
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- Environments table
      CREATE TABLE IF NOT EXISTS environments (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        api_key TEXT NOT NULL UNIQUE,
        project_id TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );

      -- Flags table
      CREATE TABLE IF NOT EXISTS flags (
        id TEXT PRIMARY KEY,
        key TEXT NOT NULL,
        config TEXT NOT NULL,
        env_id TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (env_id) REFERENCES environments(id) ON DELETE CASCADE
      );

      -- Indexes
      CREATE UNIQUE INDEX IF NOT EXISTS idx_env_project_name 
        ON environments(project_id, name);
      
      CREATE UNIQUE INDEX IF NOT EXISTS idx_flag_env_key 
        ON flags(env_id, key);
      
      CREATE INDEX IF NOT EXISTS idx_flag_env_id 
        ON flags(env_id);
      
      CREATE INDEX IF NOT EXISTS idx_env_api_key 
        ON environments(api_key);

      -- Migration version tracking
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `,
    down: `
      DROP TABLE IF EXISTS flags;
      DROP TABLE IF EXISTS environments;
      DROP TABLE IF EXISTS projects;
      DROP TABLE IF EXISTS schema_migrations;
    `,
  },
];

/**
 * Get current database version
 */
function getCurrentVersion(db: Database.Database): number {
  try {
    const row = db
      .prepare('SELECT MAX(version) as version FROM schema_migrations')
      .get() as { version: number | null };
    return row.version ?? 0;
  } catch {
    // Table doesn't exist yet
    return 0;
  }
}

/**
 * Run pending migrations
 */
export function runMigrations(db: Database.Database): void {
  const currentVersion = getCurrentVersion(db);
  const pendingMigrations = migrations.filter((m) => m.version > currentVersion);

  if (pendingMigrations.length === 0) {
    return;
  }

  console.log(`Running ${pendingMigrations.length} pending migration(s)...`);

  for (const migration of pendingMigrations) {
    console.log(`  Applying migration ${migration.version}: ${migration.name}`);
    
    // Run migration in a transaction
    const migrate = db.transaction(() => {
      db.exec(migration.up);
      db
        .prepare(
          'INSERT INTO schema_migrations (version, name) VALUES (?, ?)'
        )
        .run(migration.version, migration.name);
    });

    migrate();
    console.log(`  ✓ Migration ${migration.version} applied`);
  }

  console.log('All migrations applied successfully');
}

/**
 * Initialize database with schema
 */
export function initializeDatabase(db: Database.Database): void {
  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL');
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  // Run migrations
  runMigrations(db);
}

/**
 * Reset database (for testing)
 */
export function resetDatabase(db: Database.Database): void {
  // Drop all tables
  db.exec(`
    DROP TABLE IF EXISTS flags;
    DROP TABLE IF EXISTS environments;
    DROP TABLE IF EXISTS projects;
    DROP TABLE IF EXISTS schema_migrations;
  `);
  
  // Reinitialize
  initializeDatabase(db);
}

