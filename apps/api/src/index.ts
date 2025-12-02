/**
 * Togglekit API Server
 * Entry point for the Fastify application
 */

import { createApp } from './app';
import { closeDatabaseClient } from './db/client';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function start(): Promise<void> {
  try {
    const app = await createApp({
      logger: true,
      cors: {
        origin: true, // Allow all origins in development
      },
    });

    // Start the server
    await app.listen({ port: PORT, host: HOST });

    app.log.info(`🚀 Togglekit API server listening on http://${HOST}:${PORT}`);
    app.log.info(`📊 Health check: http://${HOST}:${PORT}/health`);

    // Graceful shutdown
    const shutdown = async (signal: string): Promise<void> => {
      app.log.info(`${signal} received, shutting down gracefully...`);
      
      try {
        await app.close();
        closeDatabaseClient();
        app.log.info('Server closed successfully');
        process.exit(0);
      } catch (error) {
        app.log.error(error, 'Error during shutdown');
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
start();
