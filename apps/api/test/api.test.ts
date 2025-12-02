/**
 * Integration tests for Togglekit API
 * Tests all endpoints with a test database
 */

import { FastifyInstance } from 'fastify';
import { createApp } from '../src/app';
import { DatabaseClient, setDatabaseClient, closeDatabaseClient } from '../src/db/client';
import { EnvironmentId, ApiKey } from '../src/db/types';

describe('Togglekit API', () => {
  let app: FastifyInstance;
  let db: DatabaseClient;
  let testApiKey: ApiKey;
  let testEnvId: EnvironmentId;

  beforeAll(async () => {
    // Create in-memory database for tests
    db = new DatabaseClient(':memory:');

    // Set as test database
    setDatabaseClient(db);
    
    // Create app
    app = await createApp({ logger: false });

    // Create test project and environment
    const project = db.createProject({ name: 'Test Project' });
    const environment = db.createEnvironment({
      name: 'development',
      projectId: project.id,
    });
    
    testEnvId = environment.id;
    testApiKey = environment.apiKey;
  });

  afterAll(async () => {
    await app.close();
    db.close();
    closeDatabaseClient();
  });

  afterEach(() => {
    // Clean up flags after each test
    const flags = db.listFlagsByEnvironment(testEnvId);
    for (const flag of flags) {
      db.deleteFlag(flag.id);
    }
  });

  describe('Health Check', () => {
    it('should return 200 OK', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('ok');
      expect(body.timestamp).toBeDefined();
    });
  });

  describe('Authentication', () => {
    it('should reject requests without API key', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/config',
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('API key required');
    });

    it('should reject requests with invalid API key', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/config?apiKey=invalid-key',
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Invalid API key');
    });

    it('should accept requests with valid API key', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/v1/config?apiKey=${testApiKey}`,
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('GET /v1/config', () => {
    it('should return empty config when no flags exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/v1/config?apiKey=${testApiKey}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toEqual({});
    });

    it('should return all flags in FlagConfig format', async () => {
      // Create test flag
      db.createFlag({
        key: 'test-flag',
        envId: testEnvId,
        config: JSON.stringify({
          key: 'test-flag',
          defaultValue: true,
          rules: [],
        }),
      });

      const response = await app.inject({
        method: 'GET',
        url: `/v1/config?apiKey=${testApiKey}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body['test-flag']).toBeDefined();
      expect(body['test-flag'].key).toBe('test-flag');
      expect(body['test-flag'].defaultValue).toBe(true);
    });
  });

  describe('POST /v1/flags', () => {
    it('should create a new flag', async () => {
      const flagConfig = {
        key: 'new-feature',
        defaultValue: false,
        description: 'Test feature flag',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/v1/flags',
        payload: {
          key: 'new-feature',
          config: JSON.stringify(flagConfig),
          apiKey: testApiKey,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.key).toBe('new-feature');
      expect(body.envId).toBe(testEnvId);
      expect(JSON.parse(body.config)).toEqual(flagConfig);
    });

    it('should reject duplicate flag keys', async () => {
      const flagConfig = {
        key: 'duplicate-flag',
        defaultValue: false,
      };

      // Create first flag
      await app.inject({
        method: 'POST',
        url: '/v1/flags',
        payload: {
          key: 'duplicate-flag',
          config: JSON.stringify(flagConfig),
          apiKey: testApiKey,
        },
      });

      // Try to create duplicate
      const response = await app.inject({
        method: 'POST',
        url: '/v1/flags',
        payload: {
          key: 'duplicate-flag',
          config: JSON.stringify(flagConfig),
          apiKey: testApiKey,
        },
      });

      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.body);
      expect(body.message).toContain('already exists');
    });

    it('should reject invalid JSON config', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/flags',
        payload: {
          key: 'bad-config',
          config: 'not valid json',
          apiKey: testApiKey,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toContain('valid JSON');
    });
  });

  describe('GET /v1/flags', () => {
    it('should list all flags', async () => {
      // Create test flags
      db.createFlag({
        key: 'flag-1',
        envId: testEnvId,
        config: JSON.stringify({ key: 'flag-1', defaultValue: true }),
      });
      db.createFlag({
        key: 'flag-2',
        envId: testEnvId,
        config: JSON.stringify({ key: 'flag-2', defaultValue: false }),
      });

      const response = await app.inject({
        method: 'GET',
        url: `/v1/flags?apiKey=${testApiKey}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBe(2);
      expect(body.some((f: { key: string }) => f.key === 'flag-1')).toBe(true);
      expect(body.some((f: { key: string }) => f.key === 'flag-2')).toBe(true);
    });
  });

  describe('PUT /v1/flags/:id', () => {
    it('should update flag config', async () => {
      const flag = db.createFlag({
        key: 'update-test',
        envId: testEnvId,
        config: JSON.stringify({ key: 'update-test', defaultValue: true }),
      });

      const newConfig = {
        key: 'update-test',
        defaultValue: false,
        description: 'Updated flag',
      };

      const response = await app.inject({
        method: 'PUT',
        url: `/v1/flags/${flag.id}`,
        payload: {
          config: JSON.stringify(newConfig),
          apiKey: testApiKey,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.id).toBe(flag.id);
      expect(JSON.parse(body.config)).toEqual(newConfig);
    });

    it('should return 404 for non-existent flag', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/v1/flags/non-existent-id',
        payload: {
          config: JSON.stringify({ key: 'test', defaultValue: true }),
          apiKey: testApiKey,
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('DELETE /v1/flags/:id', () => {
    it('should delete a flag', async () => {
      const flag = db.createFlag({
        key: 'delete-test',
        envId: testEnvId,
        config: JSON.stringify({ key: 'delete-test', defaultValue: true }),
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/v1/flags/${flag.id}?apiKey=${testApiKey}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);

      // Verify flag is deleted
      const deletedFlag = db.findFlagById(flag.id);
      expect(deletedFlag).toBeNull();
    });

    it('should return 404 for non-existent flag', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/v1/flags/non-existent-id?apiKey=${testApiKey}`,
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('POST /v1/evaluate', () => {
    it('should evaluate flag with matching condition', async () => {
      db.createFlag({
        key: 'eval-flag',
        envId: testEnvId,
        config: JSON.stringify({
          key: 'eval-flag',
          defaultValue: false,
          rules: [
            {
              conditions: [
                {
                  attribute: 'email',
                  operator: 'eq',
                  value: 'test@example.com',
                },
              ],
              value: true,
            },
          ],
        }),
      });

      const response = await app.inject({
        method: 'POST',
        url: '/v1/evaluate',
        payload: {
          flagKey: 'eval-flag',
          context: {
            userId: 'user-123',
            attributes: {
              email: 'test@example.com',
            },
          },
          apiKey: testApiKey,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.value).toBe(true);
      expect(body.reason).toBe('rule_match');
    });

    it('should evaluate flag with default value', async () => {
      db.createFlag({
        key: 'eval-flag-2',
        envId: testEnvId,
        config: JSON.stringify({
          key: 'eval-flag-2',
          defaultValue: false,
          rules: [
            {
              conditions: [
                {
                  attribute: 'email',
                  operator: 'eq',
                  value: 'test@example.com',
                },
              ],
              value: true,
            },
          ],
        }),
      });

      const response = await app.inject({
        method: 'POST',
        url: '/v1/evaluate',
        payload: {
          flagKey: 'eval-flag-2',
          context: {
            userId: 'user-123',
            attributes: {
              email: 'other@example.com',
            },
          },
          apiKey: testApiKey,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.value).toBe(false);
      expect(body.reason).toBe('default');
    });

    it('should handle non-existent flag', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/evaluate',
        payload: {
          flagKey: 'non-existent',
          context: {
            userId: 'user-123',
            attributes: {},
          },
          apiKey: testApiKey,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.reason).toBe('flag_not_found');
    });
  });
});
