/**
 * Core type definitions for the Togglekit feature flag system
 */
/**
 * User/request context for flag evaluation
 */
export interface Context {
    /** Unique user identifier for rollout bucketing */
    userId?: string;
    /** Additional attributes for rule matching */
    attributes: Record<string, unknown>;
}
/**
 * Supported condition operators
 */
export type ConditionOperator = 'eq' | 'neq' | 'in' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains';
/**
 * Single matching condition
 */
export interface Condition {
    /** Attribute key to check in context */
    attribute: string;
    /** Comparison operator */
    operator: ConditionOperator;
    /** Value to compare against */
    value: unknown;
}
/**
 * Targeting rule with conditions and optional percentage rollout
 */
export interface Rule {
    /** Conditions that must all be true (AND logic) */
    conditions: Condition[];
    /** Percentage of users who match conditions to include (0-100) */
    percentage?: number;
    /** Value to return if rule matches (for boolean flags) */
    value?: boolean;
    /** Variant key to return if rule matches (for variant flags) */
    variant?: string;
}
/**
 * Named variant option
 */
export interface Variant {
    /** Unique variant key */
    key: string;
    /** Optional variant value/payload */
    value?: unknown;
}
/**
 * Complete feature flag definition
 */
export interface Flag {
    /** Unique flag key */
    key: string;
    /** Default value when no rules match */
    defaultValue: boolean | string;
    /** Ordered rules to evaluate (first match wins) */
    rules?: Rule[];
    /** Available variants (for variant flags) */
    variants?: Variant[];
    /** Optional description */
    description?: string;
}
/**
 * Complete flag configuration (map of flag keys to definitions)
 */
export interface FlagConfig {
    [flagKey: string]: Flag;
}
/**
 * Reason for evaluation result (for debugging)
 */
export type EvaluationReason = 'default' | 'rule_match' | 'rollout' | 'rollout_excluded' | 'flag_not_found' | 'error';
/**
 * Result of flag evaluation
 */
export interface EvaluationResult<T = boolean | string> {
    /** The evaluated value */
    value: T;
    /** Reason for this result */
    reason: EvaluationReason;
    /** Optional additional context about the evaluation */
    metadata?: {
        /** Which rule index matched (if applicable) */
        ruleIndex?: number;
        /** Rollout bucket (0-100) if userId provided */
        bucket?: number;
        /** Error message if reason is 'error' */
        error?: string;
    };
}
//# sourceMappingURL=types.d.ts.map