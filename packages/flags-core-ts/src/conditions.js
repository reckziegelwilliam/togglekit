"use strict";
/**
 * Condition evaluation logic for feature flag rules
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateCondition = evaluateCondition;
exports.evaluateConditions = evaluateConditions;
/**
 * Get a value from the context by attribute path
 * Supports nested paths like "user.plan" or simple keys like "country"
 */
function getAttributeValue(context, attribute) {
    // First check if it's a direct attribute
    if (attribute in context.attributes) {
        return context.attributes[attribute];
    }
    // Handle nested paths (e.g., "user.plan")
    const parts = attribute.split('.');
    let value = context.attributes;
    for (const part of parts) {
        if (value && typeof value === 'object' && part in value) {
            value = value[part];
        }
        else {
            return undefined;
        }
    }
    return value;
}
/**
 * Compare two values for equality
 * Handles type coercion for common cases
 */
function areEqual(a, b) {
    // Strict equality first
    if (a === b)
        return true;
    // Handle null/undefined
    if (a == null || b == null)
        return a == b;
    // Try string comparison (common case: numbers as strings)
    return String(a) === String(b);
}
/**
 * Convert value to number if possible
 */
function toNumber(value) {
    if (typeof value === 'number')
        return value;
    if (typeof value === 'string') {
        const num = parseFloat(value);
        return isNaN(num) ? null : num;
    }
    return null;
}
/**
 * Check if a value is contained in another value
 * - String in string (substring)
 * - Value in array (includes)
 */
function contains(haystack, needle) {
    if (typeof haystack === 'string' && typeof needle === 'string') {
        return haystack.includes(needle);
    }
    if (Array.isArray(haystack)) {
        return haystack.some(item => areEqual(item, needle));
    }
    return false;
}
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
function evaluateCondition(condition, context) {
    const { attribute, operator, value } = condition;
    const actualValue = getAttributeValue(context, attribute);
    // If attribute doesn't exist in context, condition fails
    // Exception: 'neq' can match if attribute is missing and value is not undefined
    if (actualValue === undefined) {
        if (operator === 'neq') {
            return value !== undefined;
        }
        return false;
    }
    switch (operator) {
        case 'eq':
            return areEqual(actualValue, value);
        case 'neq':
            return !areEqual(actualValue, value);
        case 'in':
            if (!Array.isArray(value))
                return false;
            return value.some(v => areEqual(actualValue, v));
        case 'gt': {
            const numActual = toNumber(actualValue);
            const numValue = toNumber(value);
            if (numActual === null || numValue === null)
                return false;
            return numActual > numValue;
        }
        case 'gte': {
            const numActual = toNumber(actualValue);
            const numValue = toNumber(value);
            if (numActual === null || numValue === null)
                return false;
            return numActual >= numValue;
        }
        case 'lt': {
            const numActual = toNumber(actualValue);
            const numValue = toNumber(value);
            if (numActual === null || numValue === null)
                return false;
            return numActual < numValue;
        }
        case 'lte': {
            const numActual = toNumber(actualValue);
            const numValue = toNumber(value);
            if (numActual === null || numValue === null)
                return false;
            return numActual <= numValue;
        }
        case 'contains':
            return contains(actualValue, value);
        default:
            // Unknown operator
            return false;
    }
}
/**
 * Evaluate all conditions in a rule (AND logic)
 *
 * @param conditions - Array of conditions to evaluate
 * @param context - The evaluation context
 * @returns true if all conditions match, false if any fail
 */
function evaluateConditions(conditions, context) {
    if (!conditions || conditions.length === 0) {
        return true; // No conditions means rule matches
    }
    return conditions.every(condition => evaluateCondition(condition, context));
}
//# sourceMappingURL=conditions.js.map