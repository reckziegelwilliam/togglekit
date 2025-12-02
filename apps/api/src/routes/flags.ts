/**
 * CRUD endpoints for flag management
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getDatabaseClient } from '../db/client';
import { authenticateApiKey, hasEnvironment } from '../middleware/auth';
import { FlagId } from '../db/types';
import {
  CreateFlagRequest,
  UpdateFlagRequest,
  ListFlagsRequest,
  FlagResponse,
} from '../types/api';

export async function flagRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /v1/flags - List all flags in the environment
   */
  fastify.get<{
    Querystring: ListFlagsRequest;
    Reply: FlagResponse[];
  }>(
    '/v1/flags',
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

        const response: FlagResponse[] = flags.map((flag) => ({
          id: flag.id,
          key: flag.key,
          config: flag.config,
          envId: flag.envId,
          createdAt: flag.createdAt.toISOString(),
          updatedAt: flag.updatedAt.toISOString(),
        }));

        return reply.send(response);
      } catch (error) {
        request.log.error(error, 'Failed to list flags');
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to list flags',
          statusCode: 500,
        });
      }
    }
  );

  /**
   * POST /v1/flags - Create a new flag
   */
  fastify.post<{
    Body: CreateFlagRequest;
    Reply: FlagResponse;
  }>(
    '/v1/flags',
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

      const body = request.body as CreateFlagRequest;

      // Validate required fields
      if (!body.key || typeof body.key !== 'string') {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Flag key is required',
          statusCode: 400,
        });
      }

      if (!body.config || typeof body.config !== 'string') {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Flag config is required',
          statusCode: 400,
        });
      }

      // Validate config is valid JSON
      try {
        JSON.parse(body.config);
      } catch {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Flag config must be valid JSON',
          statusCode: 400,
        });
      }

      try {
        const db = getDatabaseClient();

        // Check if flag already exists
        const existing = db.findFlagByKey(request.environment.id, body.key);

        if (existing) {
          return reply.status(409).send({
            error: 'Conflict',
            message: `Flag with key '${body.key}' already exists`,
            statusCode: 409,
          });
        }

        // Create the flag
        const flag = db.createFlag({
          key: body.key,
          config: body.config,
          envId: request.environment.id,
        });

        const response: FlagResponse = {
          id: flag.id,
          key: flag.key,
          config: flag.config,
          envId: flag.envId,
          createdAt: flag.createdAt.toISOString(),
          updatedAt: flag.updatedAt.toISOString(),
        };

        return reply.status(201).send(response);
      } catch (error) {
        request.log.error(error, 'Failed to create flag');
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to create flag',
          statusCode: 500,
        });
      }
    }
  );

  /**
   * GET /v1/flags/:id - Get a specific flag
   */
  fastify.get<{
    Params: { id: string };
    Querystring: { apiKey: string };
    Reply: FlagResponse;
  }>(
    '/v1/flags/:id',
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

      const params = request.params as { id: string };

      try {
        const db = getDatabaseClient();
        const flag = db.findFlagById(params.id as FlagId);

        if (!flag || flag.envId !== request.environment.id) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Flag not found',
            statusCode: 404,
          });
        }

        const response: FlagResponse = {
          id: flag.id,
          key: flag.key,
          config: flag.config,
          envId: flag.envId,
          createdAt: flag.createdAt.toISOString(),
          updatedAt: flag.updatedAt.toISOString(),
        };

        return reply.send(response);
      } catch (error) {
        request.log.error(error, 'Failed to get flag');
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to get flag',
          statusCode: 500,
        });
      }
    }
  );

  /**
   * PUT /v1/flags/:id - Update a flag
   */
  fastify.put<{
    Params: { id: string };
    Body: UpdateFlagRequest;
    Reply: FlagResponse;
  }>(
    '/v1/flags/:id',
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

      const params = request.params as { id: string };
      const body = request.body as UpdateFlagRequest;

      // Validate config
      if (!body.config || typeof body.config !== 'string') {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Flag config is required',
          statusCode: 400,
        });
      }

      // Validate config is valid JSON
      try {
        JSON.parse(body.config);
      } catch {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Flag config must be valid JSON',
          statusCode: 400,
        });
      }

      try {
        const db = getDatabaseClient();

        // Check if flag exists and belongs to this environment
        const existing = db.findFlagById(params.id as FlagId);

        if (!existing || existing.envId !== request.environment.id) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Flag not found',
            statusCode: 404,
          });
        }

        // Update the flag
        const flag = db.updateFlag(params.id as FlagId, {
          config: body.config,
        });

        if (!flag) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Flag not found',
            statusCode: 404,
          });
        }

        const response: FlagResponse = {
          id: flag.id,
          key: flag.key,
          config: flag.config,
          envId: flag.envId,
          createdAt: flag.createdAt.toISOString(),
          updatedAt: flag.updatedAt.toISOString(),
        };

        return reply.send(response);
      } catch (error) {
        request.log.error(error, 'Failed to update flag');
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to update flag',
          statusCode: 500,
        });
      }
    }
  );

  /**
   * DELETE /v1/flags/:id - Delete a flag
   */
  fastify.delete<{
    Params: { id: string };
    Querystring: { apiKey: string };
    Reply: { success: boolean };
  }>(
    '/v1/flags/:id',
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

      const params = request.params as { id: string };

      try {
        const db = getDatabaseClient();

        // Check if flag exists and belongs to this environment
        const existing = db.findFlagById(params.id as FlagId);

        if (!existing || existing.envId !== request.environment.id) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Flag not found',
            statusCode: 404,
          });
        }

        // Delete the flag
        const deleted = db.deleteFlag(params.id as FlagId);

        if (!deleted) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Flag not found',
            statusCode: 404,
          });
        }

        return reply.send({ success: true });
      } catch (error) {
        request.log.error(error, 'Failed to delete flag');
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to delete flag',
          statusCode: 500,
        });
      }
    }
  );
}
