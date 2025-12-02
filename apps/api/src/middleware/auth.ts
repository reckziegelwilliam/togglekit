/**
 * Authentication middleware for API key validation
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { getDatabaseClient } from '../db/client';
import { Environment } from '../db/types';

/**
 * Extract API key from request query or body
 */
function extractApiKey(request: FastifyRequest): string | undefined {
  // Check query params (for GET requests)
  const query = request.query as Record<string, unknown>;
  if (query.apiKey && typeof query.apiKey === 'string') {
    return query.apiKey;
  }

  // Check body (for POST/PUT/DELETE requests)
  const body = request.body as Record<string, unknown> | undefined;
  if (body?.apiKey && typeof body.apiKey === 'string') {
    return body.apiKey;
  }

  // Check Authorization header as fallback
  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return undefined;
}

/**
 * Validate API key and resolve environment
 * Attaches resolved environment to request object
 */
export async function authenticateApiKey(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const apiKey = extractApiKey(request);

  if (!apiKey) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'API key required',
      statusCode: 401,
    });
  }

  try {
    const db = getDatabaseClient();
    const environment = db.findEnvironmentByApiKey(apiKey);

    if (!environment) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid API key',
        statusCode: 401,
      });
    }

    // Attach resolved environment to request
    (request as FastifyRequest & { environment: Environment }).environment = environment;
  } catch (error) {
    request.log.error(error, 'Failed to validate API key');
    return reply.status(500).send({
      error: 'Internal Server Error',
      message: 'Failed to validate API key',
      statusCode: 500,
    });
  }
}

/**
 * Type guard to check if request has authenticated environment
 */
export function hasEnvironment(
  request: FastifyRequest
): request is FastifyRequest & { environment: Environment } {
  return 'environment' in request && !!request.environment;
}
