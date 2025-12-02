/**
 * Condition evaluation logic for feature flag rules
 */
import { Condition, Context } from './types';
/**
 * Evaluate a single condition against a context
 *
 * @param condition - The condition to evaluate
 * @param context - The evaluation context with user attributes
 * @returns true if the condition matches, false otherwise
 *
 * @example
 * ```typescript
 * const condition: Condition = { attribute: 'country', operator: 'eq', value: 'US' };
 * const context: Context = { attributes: { country: 'US' } };
 * evaluateCondition(condition, context); // true
 * ```
 */
export declare function evaluateCondition(condition: Condition, context: Context): boolean;
/**
 * Evaluate all conditions in a rule (AND logic)
 *
 * @param conditions - Array of conditions to evaluate
 * @param context - The evaluation context
 * @returns true if all conditions match, false if any fail
 */
export declare function evaluateConditions(conditions: Condition[], context: Context): boolean;
//# sourceMappingURL=conditions.d.ts.map