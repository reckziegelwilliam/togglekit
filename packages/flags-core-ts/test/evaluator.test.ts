/**
 * Tests for the main Evaluator class
 */

import { Evaluator } from '../src/evaluator';
import { FlagConfig, Context } from '../src/types';

describe('Evaluator', () => {
  describe('constructor', () => {
    it('should create evaluator with config', () => {
      const config: FlagConfig = {
        'test-flag': {
          key: 'test-flag',
          defaultValue: true
        }
      };
      const evaluator = new Evaluator(config);
      expect(evaluator).toBeInstanceOf(Evaluator);
    });
  });

  describe('evalBool', () => {
    it('should return default value for simple flag', () => {
      const config: FlagConfig = {
        'simple-on': {
          key: 'simple-on',
          defaultValue: true
        },
        'simple-off': {
          key: 'simple-off',
          defaultValue: false
        }
      };
      const evaluator = new Evaluator(config);
      const context: Context = { attributes: {} };

      const result1 = evaluator.evalBool('simple-on', context);
      expect(result1.value).toBe(true);
      expect(result1.reason).toBe('default');

      const result2 = evaluator.evalBool('simple-off', context);
      expect(result2.value).toBe(false);
      expect(result2.reason).toBe('default');
    });

    it('should return false for non-existent flag', () => {
      const config: FlagConfig = {};
      const evaluator = new Evaluator(config);
      const context: Context = { attributes: {} };

      const result = evaluator.evalBool('missing-flag', context);
      expect(result.value).toBe(false);
      expect(result.reason).toBe('flag_not_found');
      expect(result.metadata?.error).toContain('missing-flag');
    });

    it('should evaluate rule with matching conditions', () => {
      const config: FlagConfig = {
        'premium-feature': {
          key: 'premium-feature',
          defaultValue: false,
          rules: [
            {
              conditions: [
                { attribute: 'plan', operator: 'eq', value: 'premium' }
              ],
              value: true
            }
          ]
        }
      };
      const evaluator = new Evaluator(config);

      const result = evaluator.evalBool('premium-feature', {
        attributes: { plan: 'premium' }
      });
      expect(result.value).toBe(true);
      expect(result.reason).toBe('rule_match');
      expect(result.metadata?.ruleIndex).toBe(0);
    });

    it('should return default when no rules match', () => {
      const config: FlagConfig = {
        'premium-feature': {
          key: 'premium-feature',
          defaultValue: false,
          rules: [
            {
              conditions: [
                { attribute: 'plan', operator: 'eq', value: 'premium' }
              ],
              value: true
            }
          ]
        }
      };
      const evaluator = new Evaluator(config);

      const result = evaluator.evalBool('premium-feature', {
        attributes: { plan: 'free' }
      });
      expect(result.value).toBe(false);
      expect(result.reason).toBe('default');
    });

    it('should use first matching rule (rule ordering)', () => {
      const config: FlagConfig = {
        'test-flag': {
          key: 'test-flag',
          defaultValue: false,
          rules: [
            {
              conditions: [
                { attribute: 'country', operator: 'eq', value: 'US' }
              ],
              value: true
            },
            {
              conditions: [
                { attribute: 'country', operator: 'in', value: ['US', 'UK'] }
              ],
              value: false
            }
          ]
        }
      };
      const evaluator = new Evaluator(config);

      const result = evaluator.evalBool('test-flag', {
        attributes: { country: 'US' }
      });
      // First rule should match
      expect(result.value).toBe(true);
      expect(result.metadata?.ruleIndex).toBe(0);
    });

    it('should handle percentage rollout with userId', () => {
      const config: FlagConfig = {
        'rollout-flag': {
          key: 'rollout-flag',
          defaultValue: false,
          rules: [
            {
              conditions: [],
              percentage: 50,
              value: true
            }
          ]
        }
      };
      const evaluator = new Evaluator(config);

      const result = evaluator.evalBool('rollout-flag', {
        userId: 'user-123',
        attributes: {}
      });
      // Result depends on bucket - user might be included or excluded
      // If included: reason='rollout' and value=true
      // If excluded: reason='default' and value=false (fallback to default)
      if (result.reason === 'rollout') {
        expect(result.value).toBe(true);
        expect(result.metadata?.bucket).toBeDefined();
      } else {
        expect(result.reason).toBe('default');
        expect(result.value).toBe(false);
      }
    });

    it('should exclude from rollout without userId', () => {
      const config: FlagConfig = {
        'rollout-flag': {
          key: 'rollout-flag',
          defaultValue: false,
          rules: [
            {
              conditions: [],
              percentage: 50,
              value: true
            }
          ]
        }
      };
      const evaluator = new Evaluator(config);

      const result = evaluator.evalBool('rollout-flag', {
        attributes: {}
      });
      // No userId means default
      expect(result.value).toBe(false);
      expect(result.reason).toBe('default');
    });

    it('should be deterministic for same userId', () => {
      const config: FlagConfig = {
        'rollout-flag': {
          key: 'rollout-flag',
          defaultValue: false,
          rules: [
            {
              conditions: [],
              percentage: 50,
              value: true
            }
          ]
        }
      };
      const evaluator = new Evaluator(config);
      const context: Context = {
        userId: 'user-123',
        attributes: {}
      };

      const result1 = evaluator.evalBool('rollout-flag', context);
      const result2 = evaluator.evalBool('rollout-flag', context);
      
      // Same user should always get same result
      expect(result1.value).toBe(result2.value);
      expect(result1.metadata?.bucket).toBe(result2.metadata?.bucket);
    });

    it('should handle combined conditions and rollout', () => {
      const config: FlagConfig = {
        'premium-rollout': {
          key: 'premium-rollout',
          defaultValue: false,
          rules: [
            {
              conditions: [
                { attribute: 'plan', operator: 'eq', value: 'premium' }
              ],
              percentage: 50,
              value: true
            }
          ]
        }
      };
      const evaluator = new Evaluator(config);

      // Premium user with userId
      const result1 = evaluator.evalBool('premium-rollout', {
        userId: 'user-123',
        attributes: { plan: 'premium' }
      });
      // Will be in or out of rollout depending on bucket
      expect(['rollout', 'default']).toContain(result1.reason);

      // Free user should always be excluded
      const result2 = evaluator.evalBool('premium-rollout', {
        userId: 'user-456',
        attributes: { plan: 'free' }
      });
      expect(result2.value).toBe(false);
      expect(result2.reason).toBe('default');
    });
  });

  describe('evalVariant', () => {
    it('should return default variant', () => {
      const config: FlagConfig = {
        'theme': {
          key: 'theme',
          defaultValue: 'light',
          variants: [
            { key: 'light' },
            { key: 'dark' }
          ]
        }
      };
      const evaluator = new Evaluator(config);

      const result = evaluator.evalVariant('theme', { attributes: {} });
      expect(result.value).toBe('light');
      expect(result.reason).toBe('default');
    });

    it('should return variant based on rule', () => {
      const config: FlagConfig = {
        'theme': {
          key: 'theme',
          defaultValue: 'light',
          variants: [
            { key: 'light' },
            { key: 'dark' }
          ],
          rules: [
            {
              conditions: [
                { attribute: 'preference', operator: 'eq', value: 'dark' }
              ],
              variant: 'dark'
            }
          ]
        }
      };
      const evaluator = new Evaluator(config);

      const result = evaluator.evalVariant('theme', {
        attributes: { preference: 'dark' }
      });
      expect(result.value).toBe('dark');
      expect(result.reason).toBe('rule_match');
    });

    it('should return "default" for non-existent flag', () => {
      const config: FlagConfig = {};
      const evaluator = new Evaluator(config);

      const result = evaluator.evalVariant('missing', { attributes: {} });
      expect(result.value).toBe('default');
      expect(result.reason).toBe('flag_not_found');
    });

    it('should handle multiple variant rules', () => {
      const config: FlagConfig = {
        'layout': {
          key: 'layout',
          defaultValue: 'control',
          variants: [
            { key: 'control' },
            { key: 'variant-a' },
            { key: 'variant-b' }
          ],
          rules: [
            {
              conditions: [
                { attribute: 'country', operator: 'eq', value: 'US' }
              ],
              variant: 'variant-a'
            },
            {
              conditions: [
                { attribute: 'country', operator: 'eq', value: 'UK' }
              ],
              variant: 'variant-b'
            }
          ]
        }
      };
      const evaluator = new Evaluator(config);

      const resultUS = evaluator.evalVariant('layout', {
        attributes: { country: 'US' }
      });
      expect(resultUS.value).toBe('variant-a');

      const resultUK = evaluator.evalVariant('layout', {
        attributes: { country: 'UK' }
      });
      expect(resultUK.value).toBe('variant-b');

      const resultOther = evaluator.evalVariant('layout', {
        attributes: { country: 'CA' }
      });
      expect(resultOther.value).toBe('control');
    });
  });

  describe('utility methods', () => {
    it('hasFlag should return true for existing flag', () => {
      const config: FlagConfig = {
        'test-flag': {
          key: 'test-flag',
          defaultValue: true
        }
      };
      const evaluator = new Evaluator(config);

      expect(evaluator.hasFlag('test-flag')).toBe(true);
      expect(evaluator.hasFlag('missing-flag')).toBe(false);
    });

    it('getFlagKeys should return all flag keys', () => {
      const config: FlagConfig = {
        'flag-1': { key: 'flag-1', defaultValue: true },
        'flag-2': { key: 'flag-2', defaultValue: false },
        'flag-3': { key: 'flag-3', defaultValue: 'variant' }
      };
      const evaluator = new Evaluator(config);

      const keys = evaluator.getFlagKeys();
      expect(keys).toHaveLength(3);
      expect(keys).toContain('flag-1');
      expect(keys).toContain('flag-2');
      expect(keys).toContain('flag-3');
    });

    it('getConfig should return the config', () => {
      const config: FlagConfig = {
        'test-flag': {
          key: 'test-flag',
          defaultValue: true
        }
      };
      const evaluator = new Evaluator(config);

      expect(evaluator.getConfig()).toBe(config);
    });
  });
});

