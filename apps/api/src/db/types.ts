/**
 * Comprehensive type-safe database types
 * Provides branded types, row types, and domain types for the entire database
 */

// ============================================================================
// BRANDED TYPES - Prevent mixing different ID types
// ============================================================================

declare const __brand: unique symbol;
type Brand<T, TBrand extends string> = T & { readonly [__brand]: TBrand };

export type ProjectId = Brand<string, 'ProjectId'>;
export type EnvironmentId = Brand<string, 'EnvironmentId'>;
export type FlagId = Brand<string, 'FlagId'>;
export type ApiKey = Brand<string, 'ApiKey'>;

// Type guards for branded types
export function isProjectId(value: string): value is ProjectId {
  return typeof value === 'string' && value.length > 0;
}

export function isEnvironmentId(value: string): value is EnvironmentId {
  return typeof value === 'string' && value.length > 0;
}

export function isFlagId(value: string): value is FlagId {
  return typeof value === 'string' && value.length > 0;
}

export function isApiKey(value: string): value is ApiKey {
  return typeof value === 'string' && value.length > 0;
}

// ============================================================================
// DATABASE ROW TYPES - Matches SQLite schema exactly
// ============================================================================

/**
 * Project table row (direct from SQLite)
 */
export interface ProjectRow {
  id: string;
  name: string;
  created_at: string; // ISO string in SQLite
  updated_at: string; // ISO string in SQLite
}

/**
 * Environment table row (direct from SQLite)
 */
export interface EnvironmentRow {
  id: string;
  name: string;
  api_key: string;
  project_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Flag table row (direct from SQLite)
 */
export interface FlagRow {
  id: string;
  key: string;
  config: string; // JSON string
  env_id: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// DOMAIN TYPES - Application models with proper types
// ============================================================================

/**
 * Project domain model
 */
export interface Project {
  id: ProjectId;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Environment domain model
 */
export interface Environment {
  id: EnvironmentId;
  name: string;
  apiKey: ApiKey;
  projectId: ProjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Flag domain model
 */
export interface Flag {
  id: FlagId;
  key: string;
  config: string; // JSON string (validated separately)
  envId: EnvironmentId;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// MAPPER FUNCTIONS - Convert between row and domain types
// ============================================================================

/**
 * Convert ProjectRow to Project domain model
 */
export function mapProjectRow(row: ProjectRow): Project {
  return {
    id: row.id as ProjectId,
    name: row.name,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Convert EnvironmentRow to Environment domain model
 */
export function mapEnvironmentRow(row: EnvironmentRow): Environment {
  return {
    id: row.id as EnvironmentId,
    name: row.name,
    apiKey: row.api_key as ApiKey,
    projectId: row.project_id as ProjectId,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Convert FlagRow to Flag domain model
 */
export function mapFlagRow(row: FlagRow): Flag {
  return {
    id: row.id as FlagId,
    key: row.key,
    config: row.config,
    envId: row.env_id as EnvironmentId,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// ============================================================================
// INPUT TYPES - For creating/updating records
// ============================================================================

export interface CreateProjectInput {
  name: string;
}

export interface UpdateProjectInput {
  name?: string;
}

export interface CreateEnvironmentInput {
  name: string;
  projectId: ProjectId;
}

export interface UpdateEnvironmentInput {
  name?: string;
}

export interface CreateFlagInput {
  key: string;
  config: string; // Must be valid JSON
  envId: EnvironmentId;
}

export interface UpdateFlagInput {
  config: string; // Must be valid JSON
}

// ============================================================================
// QUERY RESULT TYPES
// ============================================================================

/**
 * Result type for database operations that may fail
 */
export type DbResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Pagination parameters
 */
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

