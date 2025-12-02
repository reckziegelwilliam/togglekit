/**
 * Type-safe database client with prepared statements
 * Provides high-level, type-safe API over better-sqlite3
 */

import Database from 'better-sqlite3';
import crypto from 'crypto';
import { initializeDatabase } from './migrations';
import {
  Project,
  Environment,
  Flag,
  ProjectId,
  EnvironmentId,
  FlagId,
  ProjectRow,
  EnvironmentRow,
  FlagRow,
  mapProjectRow,
  mapEnvironmentRow,
  mapFlagRow,
  CreateProjectInput,
  UpdateProjectInput,
  CreateEnvironmentInput,
  UpdateEnvironmentInput,
  CreateFlagInput,
  UpdateFlagInput,
} from './types';

let dbInstance: DatabaseClient | null = null;

/**
 * Type-safe database client
 */
export class DatabaseClient {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    initializeDatabase(this.db);
  }

  /**
   * Close the database connection
   */
  close(): void {
    this.db.close();
  }

  // ==========================================================================
  // PROJECTS
  // ==========================================================================

  /**
   * Create a new project
   */
  createProject(input: CreateProjectInput): Project {
    const id = crypto.randomUUID();
    const stmt = this.db.prepare(`
      INSERT INTO projects (id, name, created_at, updated_at)
      VALUES (?, ?, datetime('now'), datetime('now'))
    `);
    
    stmt.run(id, input.name);
    return this.findProjectById(id as ProjectId)!;
  }

  /**
   * Find project by ID
   */
  findProjectById(id: ProjectId): Project | null {
    const stmt = this.db.prepare('SELECT * FROM projects WHERE id = ?');
    const row = stmt.get(id) as ProjectRow | undefined;
    return row ? mapProjectRow(row) : null;
  }

  /**
   * List all projects
   */
  listProjects(): Project[] {
    const stmt = this.db.prepare('SELECT * FROM projects ORDER BY created_at DESC');
    const rows = stmt.all() as ProjectRow[];
    return rows.map(mapProjectRow);
  }

  /**
   * Update project
   */
  updateProject(id: ProjectId, input: UpdateProjectInput): Project | null {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.name !== undefined) {
      updates.push('name = ?');
      values.push(input.name);
    }

    if (updates.length === 0) {
      return this.findProjectById(id);
    }

    updates.push("updated_at = datetime('now')");
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE projects 
      SET ${updates.join(', ')} 
      WHERE id = ?
    `);
    
    stmt.run(...values);
    return this.findProjectById(id);
  }

  /**
   * Delete project
   */
  deleteProject(id: ProjectId): boolean {
    const stmt = this.db.prepare('DELETE FROM projects WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // ==========================================================================
  // ENVIRONMENTS
  // ==========================================================================

  /**
   * Create a new environment
   */
  createEnvironment(input: CreateEnvironmentInput): Environment {
    const id = crypto.randomUUID();
    const apiKey = this.generateApiKey();
    
    const stmt = this.db.prepare(`
      INSERT INTO environments (id, name, api_key, project_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    
    stmt.run(id, input.name, apiKey, input.projectId);
    return this.findEnvironmentById(id as EnvironmentId)!;
  }

  /**
   * Find environment by ID
   */
  findEnvironmentById(id: EnvironmentId): Environment | null {
    const stmt = this.db.prepare('SELECT * FROM environments WHERE id = ?');
    const row = stmt.get(id) as EnvironmentRow | undefined;
    return row ? mapEnvironmentRow(row) : null;
  }

  /**
   * Find environment by API key
   */
  findEnvironmentByApiKey(apiKey: string): Environment | null {
    const stmt = this.db.prepare('SELECT * FROM environments WHERE api_key = ?');
    const row = stmt.get(apiKey) as EnvironmentRow | undefined;
    return row ? mapEnvironmentRow(row) : null;
  }

  /**
   * List environments for a project
   */
  listEnvironmentsByProject(projectId: ProjectId): Environment[] {
    const stmt = this.db.prepare(`
      SELECT * FROM environments 
      WHERE project_id = ? 
      ORDER BY name ASC
    `);
    const rows = stmt.all(projectId) as EnvironmentRow[];
    return rows.map(mapEnvironmentRow);
  }

  /**
   * Update environment
   */
  updateEnvironment(id: EnvironmentId, input: UpdateEnvironmentInput): Environment | null {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.name !== undefined) {
      updates.push('name = ?');
      values.push(input.name);
    }

    if (updates.length === 0) {
      return this.findEnvironmentById(id);
    }

    updates.push("updated_at = datetime('now')");
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE environments 
      SET ${updates.join(', ')} 
      WHERE id = ?
    `);
    
    stmt.run(...values);
    return this.findEnvironmentById(id);
  }

  /**
   * Delete environment
   */
  deleteEnvironment(id: EnvironmentId): boolean {
    const stmt = this.db.prepare('DELETE FROM environments WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // ==========================================================================
  // FLAGS
  // ==========================================================================

  /**
   * Create a new flag
   */
  createFlag(input: CreateFlagInput): Flag {
    const id = crypto.randomUUID();
    
    const stmt = this.db.prepare(`
      INSERT INTO flags (id, key, config, env_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    
    stmt.run(id, input.key, input.config, input.envId);
    return this.findFlagById(id as FlagId)!;
  }

  /**
   * Find flag by ID
   */
  findFlagById(id: FlagId): Flag | null {
    const stmt = this.db.prepare('SELECT * FROM flags WHERE id = ?');
    const row = stmt.get(id) as FlagRow | undefined;
    return row ? mapFlagRow(row) : null;
  }

  /**
   * Find flag by key in environment
   */
  findFlagByKey(envId: EnvironmentId, key: string): Flag | null {
    const stmt = this.db.prepare(`
      SELECT * FROM flags 
      WHERE env_id = ? AND key = ?
    `);
    const row = stmt.get(envId, key) as FlagRow | undefined;
    return row ? mapFlagRow(row) : null;
  }

  /**
   * List all flags in an environment
   */
  listFlagsByEnvironment(envId: EnvironmentId): Flag[] {
    const stmt = this.db.prepare(`
      SELECT * FROM flags 
      WHERE env_id = ? 
      ORDER BY created_at DESC
    `);
    const rows = stmt.all(envId) as FlagRow[];
    return rows.map(mapFlagRow);
  }

  /**
   * Update flag
   */
  updateFlag(id: FlagId, input: UpdateFlagInput): Flag | null {
    const stmt = this.db.prepare(`
      UPDATE flags 
      SET config = ?, updated_at = datetime('now') 
      WHERE id = ?
    `);
    
    stmt.run(input.config, id);
    return this.findFlagById(id);
  }

  /**
   * Delete flag
   */
  deleteFlag(id: FlagId): boolean {
    const stmt = this.db.prepare('DELETE FROM flags WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // ==========================================================================
  // UTILITY
  // ==========================================================================

  /**
   * Generate a cryptographically secure API key
   */
  private generateApiKey(): string {
    return `tk_${crypto.randomBytes(32).toString('hex')}`;
  }

  /**
   * Get the raw database instance (use with caution)
   */
  getRawDb(): Database.Database {
    return this.db;
  }
}

/**
 * Get or create singleton database client
 */
export function getDatabaseClient(): DatabaseClient {
  // Check for test override first
  if ((global as any).__testDb) {
    return (global as any).__testDb;
  }
  
  if (!dbInstance) {
    const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './dev.db';
    dbInstance = new DatabaseClient(dbPath);
  }
  return dbInstance;
}

/**
 * Set database client for testing
 */
export function setDatabaseClient(client: DatabaseClient | null): void {
  (global as any).__testDb = client;
}

/**
 * Close the database client
 */
export function closeDatabaseClient(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
  (global as any).__testDb = null;
}

/**
 * Reset the database client (for testing)
 */
export function resetDatabaseClient(): void {
  closeDatabaseClient();
}
