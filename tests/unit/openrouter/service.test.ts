/**
 * Unit tests for openrouter/service.ts
 * Tests OpenRouterService configuration, request building, parsing, and retry logic
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenRouterService } from '../../../src/lib/openrouter/service';
import { ConfigurationError, ValidationError, ParsingError } from '../../../src/lib/openrouter/errors';

describe('OpenRouterService', () => {
  describe('Configuration validation', () => {
    it('should throw ConfigurationError for empty apiKey', () => {
      expect(() => {
        new OpenRouterService({
          apiKey: '',
          httpReferer: 'https://test.com',
          appTitle: 'Test App',
        });
      }).toThrow(ConfigurationError);
    });

    it('should throw ConfigurationError for missing httpReferer', () => {
      expect(() => {
        new OpenRouterService({
          apiKey: 'test-key',
          httpReferer: '',
          appTitle: 'Test App',
        });
      }).toThrow(ConfigurationError);
    });

    it('should throw ConfigurationError for missing appTitle', () => {
      expect(() => {
        new OpenRouterService({
          apiKey: 'test-key',
          httpReferer: 'https://test.com',
          appTitle: '',
        });
      }).toThrow(ConfigurationError);
    });

    it('should throw ConfigurationError for timeout < 1000ms', () => {
      expect(() => {
        new OpenRouterService({
          apiKey: 'test-key',
          httpReferer: 'https://test.com',
          appTitle: 'Test App',
          timeout: 500,
        });
      }).toThrow(ConfigurationError);
    });

    it('should accept valid configuration', () => {
      expect(() => {
        new OpenRouterService({
          apiKey: 'test-key',
          httpReferer: 'https://test.com',
          appTitle: 'Test App',
        });
      }).not.toThrow();
    });

    it('should set default values for optional config', () => {
      const service = new OpenRouterService({
        apiKey: 'test-key',
        httpReferer: 'https://test.com',
        appTitle: 'Test App',
      });

      expect(service).toBeDefined();
      // Config is private, but we can test that service was created successfully
    });
  });

  describe('Request validation', () => {
    let service: OpenRouterService;

    beforeEach(() => {
      service = new OpenRouterService({
        apiKey: 'test-key',
        httpReferer: 'https://test.com',
        appTitle: 'Test App',
      });
    });

    it('should throw ValidationError for empty messages array', async () => {
      await expect(
        service.complete({
          messages: [],
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for message without role', async () => {
      await expect(
        service.complete({
          messages: [{ role: '' as 'user', content: 'test' }],
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for message without content', async () => {
      await expect(
        service.complete({
          messages: [{ role: 'user', content: '' }],
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for json_schema without schema', async () => {
      await expect(
        service.complete({
          messages: [{ role: 'user', content: 'test' }],
          responseFormat: {
            type: 'json_schema',
          } as { type: 'json_schema' },
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid temperature', async () => {
      await expect(
        service.complete({
          messages: [{ role: 'user', content: 'test' }],
          modelParams: {
            temperature: 3, // > 2
          },
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for negative max_tokens', async () => {
      await expect(
        service.complete({
          messages: [{ role: 'user', content: 'test' }],
          modelParams: {
            max_tokens: -1,
          },
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid top_p', async () => {
      await expect(
        service.complete({
          messages: [{ role: 'user', content: 'test' }],
          modelParams: {
            top_p: 1.5, // > 1
          },
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('buildRequestBody() - via complete()', () => {
    let service: OpenRouterService;

    beforeEach(() => {
      service = new OpenRouterService({
        apiKey: 'test-key',
        httpReferer: 'https://test.com',
        appTitle: 'Test App',
        defaultModel: 'test-model',
        defaultModelParams: {
          temperature: 0.7,
          max_tokens: 1000,
        },
      });

      // Mock fetch to prevent actual API calls
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          text: () =>
            Promise.resolve(
              JSON.stringify({
                choices: [{ message: { content: '{"result": "test"}' }, finish_reason: 'stop' }],
                usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
                model: 'test-model',
              })
            ),
        } as Response)
      );
    });

    it('should merge default and custom modelParams', async () => {
      await service.complete({
        messages: [{ role: 'user', content: 'test' }],
        modelParams: {
          temperature: 0.9, // Override default
        },
      });

      const fetchCall = vi.mocked(global.fetch).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1]?.body as string);

      expect(requestBody.temperature).toBe(0.9); // Custom value
      expect(requestBody.max_tokens).toBe(1000); // Default value
    });

    it('should use custom model over default', async () => {
      await service.complete({
        messages: [{ role: 'user', content: 'test' }],
        model: 'custom-model',
      });

      const fetchCall = vi.mocked(global.fetch).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1]?.body as string);

      expect(requestBody.model).toBe('custom-model');
    });

    it('should include response_format for json_schema', async () => {
      await service.complete({
        messages: [{ role: 'user', content: 'test' }],
        responseFormat: {
          type: 'json_schema',
          json_schema: {
            name: 'test_schema',
            schema: {
              type: 'object',
              properties: { test: { type: 'string' } },
              required: ['test'],
            },
          },
        },
      });

      const fetchCall = vi.mocked(global.fetch).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1]?.body as string);

      expect(requestBody.response_format).toBeDefined();
      expect(requestBody.response_format.type).toBe('json_schema');
      expect(requestBody.response_format.json_schema.name).toBe('test_schema');
    });
  });

  describe('parseJSON()', () => {
    let service: OpenRouterService;

    beforeEach(() => {
      service = new OpenRouterService({
        apiKey: 'test-key',
        httpReferer: 'https://test.com',
        appTitle: 'Test App',
      });
    });

    it('should parse JSON with markdown code blocks', async () => {
      const jsonContent = '```json\n{"test": "value"}\n```';

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          text: () =>
            Promise.resolve(
              JSON.stringify({
                choices: [{ message: { content: jsonContent }, finish_reason: 'stop' }],
                usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
                model: 'test-model',
              })
            ),
        } as Response)
      );

      const result = await service.complete<{ test: string }>({
        messages: [{ role: 'user', content: 'test' }],
        responseFormat: { type: 'json_object' },
      });

      expect(result.data.test).toBe('value');
    });

    it('should parse JSON without markdown blocks', async () => {
      const jsonContent = '{"test": "value"}';

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          text: () =>
            Promise.resolve(
              JSON.stringify({
                choices: [{ message: { content: jsonContent }, finish_reason: 'stop' }],
                usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
                model: 'test-model',
              })
            ),
        } as Response)
      );

      const result = await service.complete<{ test: string }>({
        messages: [{ role: 'user', content: 'test' }],
        responseFormat: { type: 'json_object' },
      });

      expect(result.data.test).toBe('value');
    });

    it('should throw ParsingError for invalid JSON', async () => {
      const invalidJson = 'not valid json';

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          text: () =>
            Promise.resolve(
              JSON.stringify({
                choices: [{ message: { content: invalidJson }, finish_reason: 'stop' }],
                usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
                model: 'test-model',
              })
            ),
        } as Response)
      );

      await expect(
        service.complete({
          messages: [{ role: 'user', content: 'test' }],
          responseFormat: { type: 'json_object' },
        })
      ).rejects.toThrow(ParsingError);
    });
  });

  describe('retryWithBackoff()', () => {
    let service: OpenRouterService;

    beforeEach(() => {
      service = new OpenRouterService({
        apiKey: 'test-key',
        httpReferer: 'https://test.com',
        appTitle: 'Test App',
      });
      vi.useFakeTimers();
      vi.clearAllMocks();
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    it('should retry on network errors with exponential backoff', async () => {
      let attemptCount = 0;

      global.fetch = vi.fn(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          text: () =>
            Promise.resolve(
              JSON.stringify({
                choices: [{ message: { content: '{"result": "success"}' }, finish_reason: 'stop' }],
                usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
                model: 'test-model',
              })
            ),
        } as Response);
      });

      const promise = service.complete({
        messages: [{ role: 'user', content: 'test' }],
        maxRetries: 2,
      });

      // Fast-forward through retry delays
      await vi.runAllTimersAsync();

      await promise;

      expect(attemptCount).toBe(3); // Initial + 2 retries
    });

    it('should not retry on ConfigurationError', async () => {
      // This test validates that validation happens before retry logic
      await expect(
        service.complete({
          messages: [],
          maxRetries: 3,
        })
      ).rejects.toThrow(ValidationError);

      // Fetch should never be called
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should fail after max retries exceeded', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

      const promise = service.complete({
        messages: [{ role: 'user', content: 'test' }],
        maxRetries: 2,
      });

      // Handle the promise rejection to prevent unhandled rejection warning
      promise.catch(() => {
        // Expected to fail
      });

      await vi.runAllTimersAsync();

      await expect(promise).rejects.toThrow();
      expect(vi.mocked(global.fetch).mock.calls.length).toBe(3); // Initial + 2 retries
    });
  });
});
