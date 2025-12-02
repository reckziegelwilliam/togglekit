/**
 * Main evaluator for feature flags
 */
import { FlagConfig, Context, EvaluationResult } from './types';
/**
 * Feature flag evaluator
 *
 * Evaluates feature flags based on configuration and user context.
 * Supports boolean flags, variant flags, conditional targeting, and percentage rollouts.
 *
 * @example
 * ```typescript
 * const config: FlagConfig = {
 *   'new-feature': {
 *     key: 'new-feature',
 *     defaultValue: false,
 *     rules: [{
 *       conditions: [{ attribute: 'plan', operator: 'eq', value: 'premium' }],
 *       value: true
 *     }]
 *   }
 * };
 *
 * const evaluator = new Evaluator(config);
 * const result = evaluator.evalBool('new-feature', {
 *   userId: 'user-123',
 *   attributes: { plan: 'premium' }
 * });
 * // result: { value: true, reason: 'rule_match', metadata: { ruleIndex: 0 } }
 * ```
 */
export declare class Evaluator {
    private config;
    /**
     * Create a new evaluator with the given flag configuration
     *
     * @param config - Map of flag keys to flag definitions
     */
    constructor(config: FlagConfig);
    /**
     * Evaluate a boolean feature flag
     *
     * @param flagKey - The flag key to evaluate
     * @param context - User context with attributes
     * @returns Evaluation result with boolean value and reason
     *
     * @example
     * ```typescript
     * const result = evaluator.evalBool('dark-mode', { attributes: { theme: 'dark' } });
     * if (result.value) {
     *   // Enable dark mode
     * }
     * ```
     */
    evalBool(flagKey: string, context: Context): EvaluationResult<boolean>;
    /**
     * Evaluate a variant feature flag
     *
     * Returns a variant key (string) based on rules or default value
     *
     * @param flagKey - The flag key to evaluate
     * @param context - User context with attributes
     * @returns Evaluation result with variant key and reason
     *
     * @example
     * ```typescript
     * const result = evaluator.evalVariant('pricing-page', {
     *   userId: 'user-123',
     *   attributes: { plan: 'free' }
     * });
     * switch (result.value) {
     *   case 'layout-a': // Show layout A
     *   case 'layout-b': // Show layout B
     *   default: // Show default layout
     * }
     * ```
     */
    evalVariant(flagKey: string, context: Context): EvaluationResult<string>;
    /**
     * Evaluate a single rule
     *
     * @param rule - The rule to evaluate
     * @param context - User context
     * @param flagKey - Flag key (for rollout bucketing)
     * @returns Object indicating if rule matched and the reason
     */
    private evaluateRule;
    /**
     * Get the raw flag configuration
     * Useful for debugging or serialization
     */
    getConfig(): FlagConfig;
    /**
     * Check if a flag exists in the configuration
     *
     * @param flagKey - The flag key to check
     * @returns true if flag exists, false otherwise
     */
    hasFlag(flagKey: string): boolean;
    /**
     * Get all flag keys in the configuration
     *
     * @returns Array of all flag keys
     */
    getFlagKeys(): string[];
}
//# sourceMappingURL=evaluator.d.ts.map