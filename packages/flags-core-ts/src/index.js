"use strict";
/**
 * @togglekit/flags-core-ts
 *
 * TypeScript core evaluator for Togglekit feature flags
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateConditions = exports.evaluateCondition = exports.computeRolloutBucket = exports.Evaluator = void 0;
// Export main evaluator class
var evaluator_1 = require("./evaluator");
Object.defineProperty(exports, "Evaluator", { enumerable: true, get: function () { return evaluator_1.Evaluator; } });
// Export utility functions
var rollout_1 = require("./rollout");
Object.defineProperty(exports, "computeRolloutBucket", { enumerable: true, get: function () { return rollout_1.computeRolloutBucket; } });
var conditions_1 = require("./conditions");
Object.defineProperty(exports, "evaluateCondition", { enumerable: true, get: function () { return conditions_1.evaluateCondition; } });
Object.defineProperty(exports, "evaluateConditions", { enumerable: true, get: function () { return conditions_1.evaluateConditions; } });
//# sourceMappingURL=index.js.map