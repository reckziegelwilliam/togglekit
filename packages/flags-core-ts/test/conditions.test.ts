/**
 * Tests for condition evaluation
 */

import { evaluateCondition, evaluateConditions } from '../src/conditions';
import { Condition, Context } from '../src/types';

describe('evaluateCondition', () => {
  describe('eq operator', () => {
    it('should match equal values', () => {
      const condition: Condition = {
        attribute: 'country',
        operator: 'eq',
        value: 'US'
      };
      const context: Context = {
        attributes: { country: 'US' }
      };
      expect(evaluateCondition(condition, context)).toBe(true);
    });

    it('should not match different values', () => {
      const condition: Condition = {
        attribute: 'country',
        operator: 'eq',
        value: 'US'
      };
      const context: Context = {
        attributes: { country: 'UK' }
      };
      expect(evaluateCondition(condition, context)).toBe(false);
    });

    it('should handle number equality', () => {
      const condition: Condition = {
        attribute: 'age',
        operator: 'eq',
        value: 25
      };
      const context: Context = {
        attributes: { age: 25 }
      };
      expect(evaluateCondition(condition, context)).toBe(true);
    });
  });

  describe('neq operator', () => {
    it('should match different values', () => {
      const condition: Condition = {
        attribute: 'country',
        operator: 'neq',
        value: 'US'
      };
      const context: Context = {
        attributes: { country: 'UK' }
      };
      expect(evaluateCondition(condition, context)).toBe(true);
    });

    it('should not match equal values', () => {
      const condition: Condition = {
        attribute: 'country',
        operator: 'neq',
        value: 'US'
      };
      const context: Context = {
        attributes: { country: 'US' }
      };
      expect(evaluateCondition(condition, context)).toBe(false);
    });

    it('should match when attribute is missing', () => {
      const condition: Condition = {
        attribute: 'missing',
        operator: 'neq',
        value: 'test'
      };
      const context: Context = {
        attributes: {}
      };
      expect(evaluateCondition(condition, context)).toBe(true);
    });
  });

  describe('in operator', () => {
    it('should match when value is in array', () => {
      const condition: Condition = {
        attribute: 'country',
        operator: 'in',
        value: ['US', 'UK', 'CA']
      };
      const context: Context = {
        attributes: { country: 'UK' }
      };
      expect(evaluateCondition(condition, context)).toBe(true);
    });

    it('should not match when value is not in array', () => {
      const condition: Condition = {
        attribute: 'country',
        operator: 'in',
        value: ['US', 'UK', 'CA']
      };
      const context: Context = {
        attributes: { country: 'FR' }
      };
      expect(evaluateCondition(condition, context)).toBe(false);
    });

    it('should handle empty array', () => {
      const condition: Condition = {
        attribute: 'country',
        operator: 'in',
        value: []
      };
      const context: Context = {
        attributes: { country: 'US' }
      };
      expect(evaluateCondition(condition, context)).toBe(false);
    });
  });

  describe('gt operator', () => {
    it('should match when value is greater', () => {
      const condition: Condition = {
        attribute: 'age',
        operator: 'gt',
        value: 18
      };
      const context: Context = {
        attributes: { age: 25 }
      };
      expect(evaluateCondition(condition, context)).toBe(true);
    });

    it('should not match when value is equal', () => {
      const condition: Condition = {
        attribute: 'age',
        operator: 'gt',
        value: 18
      };
      const context: Context = {
        attributes: { age: 18 }
      };
      expect(evaluateCondition(condition, context)).toBe(false);
    });

    it('should not match when value is less', () => {
      const condition: Condition = {
        attribute: 'age',
        operator: 'gt',
        value: 18
      };
      const context: Context = {
        attributes: { age: 16 }
      };
      expect(evaluateCondition(condition, context)).toBe(false);
    });
  });

  describe('gte operator', () => {
    it('should match when value is greater', () => {
      const condition: Condition = {
        attribute: 'age',
        operator: 'gte',
        value: 18
      };
      const context: Context = {
        attributes: { age: 25 }
      };
      expect(evaluateCondition(condition, context)).toBe(true);
    });

    it('should match when value is equal', () => {
      const condition: Condition = {
        attribute: 'age',
        operator: 'gte',
        value: 18
      };
      const context: Context = {
        attributes: { age: 18 }
      };
      expect(evaluateCondition(condition, context)).toBe(true);
    });
  });

  describe('lt operator', () => {
    it('should match when value is less', () => {
      const condition: Condition = {
        attribute: 'age',
        operator: 'lt',
        value: 18
      };
      const context: Context = {
        attributes: { age: 16 }
      };
      expect(evaluateCondition(condition, context)).toBe(true);
    });

    it('should not match when value is equal', () => {
      const condition: Condition = {
        attribute: 'age',
        operator: 'lt',
        value: 18
      };
      const context: Context = {
        attributes: { age: 18 }
      };
      expect(evaluateCondition(condition, context)).toBe(false);
    });
  });

  describe('lte operator', () => {
    it('should match when value is less', () => {
      const condition: Condition = {
        attribute: 'age',
        operator: 'lte',
        value: 18
      };
      const context: Context = {
        attributes: { age: 16 }
      };
      expect(evaluateCondition(condition, context)).toBe(true);
    });

    it('should match when value is equal', () => {
      const condition: Condition = {
        attribute: 'age',
        operator: 'lte',
        value: 18
      };
      const context: Context = {
        attributes: { age: 18 }
      };
      expect(evaluateCondition(condition, context)).toBe(true);
    });
  });

  describe('contains operator', () => {
    it('should match substring in string', () => {
      const condition: Condition = {
        attribute: 'email',
        operator: 'contains',
        value: '@example.com'
      };
      const context: Context = {
        attributes: { email: 'user@example.com' }
      };
      expect(evaluateCondition(condition, context)).toBe(true);
    });

    it('should match value in array', () => {
      const condition: Condition = {
        attribute: 'tags',
        operator: 'contains',
        value: 'beta'
      };
      const context: Context = {
        attributes: { tags: ['alpha', 'beta', 'gamma'] }
      };
      expect(evaluateCondition(condition, context)).toBe(true);
    });

    it('should not match when substring not present', () => {
      const condition: Condition = {
        attribute: 'email',
        operator: 'contains',
        value: '@test.com'
      };
      const context: Context = {
        attributes: { email: 'user@example.com' }
      };
      expect(evaluateCondition(condition, context)).toBe(false);
    });
  });

  describe('missing attributes', () => {
    it('should return false for missing attribute with eq', () => {
      const condition: Condition = {
        attribute: 'missing',
        operator: 'eq',
        value: 'test'
      };
      const context: Context = {
        attributes: {}
      };
      expect(evaluateCondition(condition, context)).toBe(false);
    });

    it('should return true for missing attribute with neq', () => {
      const condition: Condition = {
        attribute: 'missing',
        operator: 'neq',
        value: 'test'
      };
      const context: Context = {
        attributes: {}
      };
      expect(evaluateCondition(condition, context)).toBe(true);
    });
  });

  describe('nested attributes', () => {
    it('should support nested attribute paths', () => {
      const condition: Condition = {
        attribute: 'user.plan',
        operator: 'eq',
        value: 'premium'
      };
      const context: Context = {
        attributes: {
          user: {
            plan: 'premium'
          }
        }
      };
      expect(evaluateCondition(condition, context)).toBe(true);
    });

    it('should return false for deeply nested missing attributes', () => {
      const condition: Condition = {
        attribute: 'user.account.plan',
        operator: 'eq',
        value: 'premium'
      };
      const context: Context = {
        attributes: {
          user: {}
        }
      };
      expect(evaluateCondition(condition, context)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle numeric comparisons with non-numeric values', () => {
      const condition: Condition = {
        attribute: 'value',
        operator: 'gt',
        value: 10
      };
      const context: Context = {
        attributes: { value: 'not-a-number' }
      };
      expect(evaluateCondition(condition, context)).toBe(false);
    });

    it('should handle contains with non-string/non-array haystack', () => {
      const condition: Condition = {
        attribute: 'value',
        operator: 'contains',
        value: 'test'
      };
      const context: Context = {
        attributes: { value: 123 }
      };
      expect(evaluateCondition(condition, context)).toBe(false);
    });

    it('should handle in operator with non-array value', () => {
      const condition: Condition = {
        attribute: 'country',
        operator: 'in',
        value: 'US'
      };
      const context: Context = {
        attributes: { country: 'US' }
      };
      expect(evaluateCondition(condition, context)).toBe(false);
    });

    it('should handle string number comparisons', () => {
      const condition: Condition = {
        attribute: 'age',
        operator: 'gt',
        value: '18'
      };
      const context: Context = {
        attributes: { age: '25' }
      };
      expect(evaluateCondition(condition, context)).toBe(true);
    });
  });
});

describe('evaluateConditions', () => {
  it('should return true for empty conditions array', () => {
    const context: Context = { attributes: {} };
    expect(evaluateConditions([], context)).toBe(true);
  });

  it('should return true when all conditions match', () => {
    const conditions: Condition[] = [
      { attribute: 'country', operator: 'eq', value: 'US' },
      { attribute: 'age', operator: 'gt', value: 18 }
    ];
    const context: Context = {
      attributes: { country: 'US', age: 25 }
    };
    expect(evaluateConditions(conditions, context)).toBe(true);
  });

  it('should return false when any condition fails', () => {
    const conditions: Condition[] = [
      { attribute: 'country', operator: 'eq', value: 'US' },
      { attribute: 'age', operator: 'gt', value: 18 }
    ];
    const context: Context = {
      attributes: { country: 'US', age: 16 }
    };
    expect(evaluateConditions(conditions, context)).toBe(false);
  });
});

