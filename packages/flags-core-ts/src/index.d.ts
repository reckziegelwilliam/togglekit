/**
 * @togglekit/flags-core-ts
 *
 * TypeScript core evaluator for Togglekit feature flags
 */
export { Evaluator } from './evaluator';
export type { Context, Condition, ConditionOperator, Rule, Variant, Flag, FlagConfig, EvaluationResult, EvaluationReason } from './types';
export { computeRolloutBucket } from './rollout';
export { evaluateCondition, evaluateConditions } from './conditions';
//# sourceMappingURL=index.d.ts.map