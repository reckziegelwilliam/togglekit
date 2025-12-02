/**
 * API type definitions
 */

import { FlagConfig, Context, EvaluationResult } from '@togglekit/flags-core-ts';

/**
 * Request query for SDK config endpoint
 */
export interface ConfigRequest {
  apiKey: string;
}

/**
 * Response for SDK config endpoint
 */
export type ConfigResponse = FlagConfig;

/**
 * Request body for flag creation
 */
export interface CreateFlagRequest {
  key: string;
  config: string; // JSON string of Flag definition
  apiKey: string;
}

/**
 * Request body for flag update
 */
export interface UpdateFlagRequest {
  config: string; // JSON string of Flag definition
  apiKey: string;
}

/**
 * Request query for flag list
 */
export interface ListFlagsRequest {
  apiKey: string;
}

/**
 * Flag response
 */
export interface FlagResponse {
  id: string;
  key: string;
  config: string;
  envId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Request body for server-side evaluation
 */
export interface EvaluateRequest {
  flagKey: string;
  context: Context;
  apiKey: string;
}

/**
 * Response for server-side evaluation
 */
export type EvaluateResponse = EvaluationResult;

/**
 * Error response
 */
export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}

/**
 * Environment with API key resolved (re-export for convenience)
 */
export type { Environment as ResolvedEnvironment } from '../db/types';
