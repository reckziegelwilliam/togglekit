"use strict";
/**
 * Main evaluator for feature flags
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Evaluator = void 0;
const conditions_1 = require("./conditions");
const rollout_1 = require("./rollout");
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
class Evaluator {
    /**
     * Create a new evaluator with the given flag configuration
     *
     * @param config - Map of flag keys to flag definitions
     */
    constructor(config) {
        this.config = config;
    }
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
    evalBool(flagKey, context) {
        const flag = this.config[flagKey];
        if (!flag) {
            return {
                value: false,
                reason: 'flag_not_found',
                metadata: { error: `Flag "${flagKey}" not found in configuration` }
            };
        }
        // Evaluate rules in order (first match wins)
        if (flag.rules && flag.rules.length > 0) {
            for (let i = 0; i < flag.rules.length; i++) {
                const rule = flag.rules[i];
                const ruleResult = this.evaluateRule(rule, context, flagKey);
                if (ruleResult.matched) {
                    const value = rule.value !== undefined ? rule.value : true;
                    return {
                        value: Boolean(value),
                        reason: ruleResult.reason,
                        metadata: {
                            ruleIndex: i,
                            bucket: ruleResult.bucket
                        }
                    };
                }
            }
        }
        // No rules matched, use default
        return {
            value: Boolean(flag.defaultValue),
            reason: 'default'
        };
    }
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
    evalVariant(flagKey, context) {
        const flag = this.config[flagKey];
        if (!flag) {
            return {
                value: 'default',
                reason: 'flag_not_found',
                metadata: { error: `Flag "${flagKey}" not found in configuration` }
            };
        }
        // Evaluate rules in order (first match wins)
        if (flag.rules && flag.rules.length > 0) {
            for (let i = 0; i < flag.rules.length; i++) {
                const rule = flag.rules[i];
                const ruleResult = this.evaluateRule(rule, context, flagKey);
                if (ruleResult.matched) {
                    const variant = rule.variant || String(flag.defaultValue);
                    return {
                        value: variant,
                        reason: ruleResult.reason,
                        metadata: {
                            ruleIndex: i,
                            bucket: ruleResult.bucket
                        }
                    };
                }
            }
        }
        // No rules matched, use default
        return {
            value: String(flag.defaultValue),
            reason: 'default'
        };
    }
    /**
     * Evaluate a single rule
     *
     * @param rule - The rule to evaluate
     * @param context - User context
     * @param flagKey - Flag key (for rollout bucketing)
     * @returns Object indicating if rule matched and the reason
     */
    evaluateRule(rule, context, flagKey) {
        // First, check if all conditions match
        const conditionsMatch = (0, conditions_1.evaluateConditions)(rule.conditions || [], context);
        if (!conditionsMatch) {
            return { matched: false, reason: 'rollout_excluded' };
        }
        // Conditions match, now check percentage rollout
        if (rule.percentage !== undefined && rule.percentage < 100) {
            // Need userId for rollout bucketing
            if (!context.userId) {
                // No userId provided, can't do rollout - exclude by default
                return { matched: false, reason: 'rollout_excluded' };
            }
            const bucket = (0, rollout_1.computeRolloutBucket)(context.userId, flagKey);
            if (bucket <= rule.percentage) {
                return { matched: true, reason: 'rollout', bucket };
            }
            else {
                return { matched: false, reason: 'rollout_excluded', bucket };
            }
        }
        // All conditions match and no rollout restriction
        return { matched: true, reason: 'rule_match' };
    }
    /**
     * Get the raw flag configuration
     * Useful for debugging or serialization
     */
    getConfig() {
        return this.config;
    }
    /**
     * Check if a flag exists in the configuration
     *
     * @param flagKey - The flag key to check
     * @returns true if flag exists, false otherwise
     */
    hasFlag(flagKey) {
        return flagKey in this.config;
    }
    /**
     * Get all flag keys in the configuration
     *
     * @returns Array of all flag keys
     */
    getFlagKeys() {
        return Object.keys(this.config);
    }
}
exports.Evaluator = Evaluator;
//# sourceMappingURL=evaluator.js.map