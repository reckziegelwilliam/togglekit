/**
 * @togglekit/flags-core-ts
 * 
 * TypeScript core evaluator for Togglekit feature flags
 */

// Export main evaluator class
export { Evaluator } from './evaluator';

// Export all types
export type {
  Context,
  Condition,
  ConditionOperator,
  Rule,
  Variant,
  Flag,
  FlagConfig,
  EvaluationResult,
  EvaluationReason
} from './types';

// Export utility functions
export { computeRolloutBucket } from './rollout';
export { evaluateCondition, evaluateConditions } from './conditions';

