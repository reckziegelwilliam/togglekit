/**
 * Server-side evaluation endpoint
 * POST /v1/evaluate
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Evaluator } from '@togglekit/flags-core-ts';
import { getDatabaseClient } from '../db/client';
import { authenticateApiKey, hasEnvironment } from '../middleware/auth';
import { EvaluateRequest, EvaluateResponse } from '../types/api';

export async function evaluateRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * POST /v1/evaluate - Evaluate a flag server-side
   * Useful for server-to-server evaluation without needing to fetch entire config
   */
  fastify.post<{
    Body: EvaluateRequest;
    Reply: EvaluateResponse;
  }>(
    '/v1/evaluate',
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

      const body = request.body as EvaluateRequest;

      // Validate request
      if (!body.flagKey || typeof body.flagKey !== 'string') {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'flagKey is required',
          statusCode: 400,
        });
      }

      if (!body.context || typeof body.context !== 'object') {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'context is required',
          statusCode: 400,
        });
      }

      try {
        const db = getDatabaseClient();

        // Fetch all flags for the environment
        const flags = db.listFlagsByEnvironment(request.environment.id);

        // Build FlagConfig
        const flagConfig: Record<string, any> = {};
        for (const flag of flags) {
          try {
            flagConfig[flag.key] = JSON.parse(flag.config);
          } catch (error) {
            request.log.error(
              { flagKey: flag.key, error },
              'Failed to parse flag config'
            );
            continue;
          }
        }

        // Evaluate using the core evaluator
        const evaluator = new Evaluator(flagConfig);
        
        // Try boolean evaluation first
        const result = evaluator.evalBool(body.flagKey, body.context);

        return reply.send(result);
      } catch (error) {
        request.log.error(error, 'Failed to evaluate flag');
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to evaluate flag',
          statusCode: 500,
        });
      }
    }
  );
}
