/**
 * Integration tests using JSON fixtures
 * These tests verify the evaluator works with real-world configs
 */

import { Evaluator } from '../src/evaluator';
import { FlagConfig } from '../src/types';
import basicFixture from '../fixtures/case-basic.json';
import rolloutFixture from '../fixtures/case-rollout.json';
import variantsFixture from '../fixtures/case-variants.json';

describe('Integration tests with fixtures', () => {
  describe('Basic flags', () => {
    const evaluator = new Evaluator(basicFixture.config as FlagConfig);

    basicFixture.testCases.forEach((testCase) => {
      it(testCase.name, () => {
        const result = evaluator.evalBool(testCase.flagKey, testCase.context);
        
        if (testCase.expected.value !== undefined) {
          expect(result.value).toBe(testCase.expected.value);
        }
        
        if (testCase.expected.reason) {
          expect(result.reason).toBe(testCase.expected.reason);
        }
      });
    });
  });

  describe('Rollout flags', () => {
    const evaluator = new Evaluator(rolloutFixture.config as FlagConfig);

    it('should be deterministic for same userId', () => {
      const context = {
        userId: 'user-1',
        attributes: {}
      };

      const result1 = evaluator.evalBool('rollout-50', context);
      const result2 = evaluator.evalBool('rollout-50', context);
      
      expect(result1.value).toBe(result2.value);
      expect(result1.metadata?.bucket).toBe(result2.metadata?.bucket);
    });

    it('should exclude users without userId from rollout', () => {
      const context = {
        attributes: {}
      };

      const result = evaluator.evalBool('rollout-50', context);
      expect(result.value).toBe(false);
      expect(result.reason).toBe('default');
    });

    it('should respect condition before checking rollout', () => {
      const premiumUser = {
        userId: 'premium-user-1',
        attributes: { plan: 'premium' }
      };

      const freeUser = {
        userId: 'free-user-1',
        attributes: { plan: 'free' }
      };

      const result1 = evaluator.evalBool('rollout-25-premium', premiumUser);
      // Premium user might be in or out of rollout
      expect(['rollout', 'default']).toContain(result1.reason);

      const result2 = evaluator.evalBool('rollout-25-premium', freeUser);
      // Free user should always be excluded
      expect(result2.value).toBe(false);
      expect(result2.reason).toBe('default');
    });
  });

  describe('Variant flags', () => {
    const evaluator = new Evaluator(variantsFixture.config as FlagConfig);

    variantsFixture.testCases.forEach((testCase) => {
      it(testCase.name, () => {
        const result = evaluator.evalVariant(testCase.flagKey, testCase.context);
        
        if (testCase.expected.value !== undefined) {
          expect(result.value).toBe(testCase.expected.value);
        }
        
        if (testCase.expected.reason) {
          expect(result.reason).toBe(testCase.expected.reason);
        }
      });
    });
  });
});

