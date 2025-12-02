/**
 * Config endpoint for SDKs to fetch flag configurations
 * GET /v1/config?apiKey=<key>
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { FlagConfig } from '@togglekit/flags-core-ts';
import { getDatabaseClient } from '../db/client';
import { authenticateApiKey, hasEnvironment } from '../middleware/auth';
import { ConfigRequest, ConfigResponse } from '../types/api';

export async function configRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /v1/config - Fetch all flags for an environment
   * Used by SDKs to get the complete flag configuration
   */
  fastify.get<{
    Querystring: ConfigRequest;
    Reply: ConfigResponse;
  }>(
    '/v1/config',
    {
      preHandler: authenticateApiKey,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!hasEnvironment(request)) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Authentication required',
          statusCode: 401,
        });
      }

      try {
        const db = getDatabaseClient();
        const flags = db.listFlagsByEnvironment(request.environment.id);

        // Transform database records into FlagConfig format
        const flagConfig: FlagConfig = {};
        for (const flag of flags) {
          try {
            // Parse the stored JSON config
            const parsedConfig = JSON.parse(flag.config);
            flagConfig[flag.key] = parsedConfig;
          } catch (error) {
            request.log.error(
              { flagKey: flag.key, error },
              'Failed to parse flag config'
            );
            // Skip malformed flags
            continue;
          }
        }

        return reply.send(flagConfig);
      } catch (error) {
        request.log.error(error, 'Failed to fetch config');
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch config',
          statusCode: 500,
        });
      }
    }
  );
}
