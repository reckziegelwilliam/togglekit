/**
 * Fastify application factory
 * Creates and configures the Fastify server instance
 */

import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { configRoutes } from './routes/config';
import { flagRoutes } from './routes/flags';
import { evaluateRoutes } from './routes/evaluate';

export interface AppOptions {
  logger?: boolean;
  cors?: {
    origin: string | string[] | boolean;
  };
}

/**
 * Create and configure Fastify application
 */
export async function createApp(options: AppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.logger ?? true,
    disableRequestLogging: false,
    requestIdHeader: 'x-request-id',
  });

  // Register CORS
  await app.register(cors, {
    origin: options.cors?.origin ?? true,
    credentials: true,
  });

  // Health check endpoint
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Register routes
  await app.register(configRoutes);
  await app.register(flagRoutes);
  await app.register(evaluateRoutes);

  // Global error handler
  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    
    // Handle validation errors
    if (error.validation) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Validation failed',
        statusCode: 400,
        details: error.validation,
      });
    }

    // Default error response
    const statusCode = error.statusCode ?? 500;
    return reply.status(statusCode).send({
      error: error.name || 'Internal Server Error',
      message: error.message || 'An unexpected error occurred',
      statusCode,
    });
  });

  // 404 handler
  app.setNotFoundHandler((request, reply) => {
    return reply.status(404).send({
      error: 'Not Found',
      message: `Route ${request.method} ${request.url} not found`,
      statusCode: 404,
    });
  });

  return app;
}

