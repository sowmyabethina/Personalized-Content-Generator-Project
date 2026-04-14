/**
 * Backend Constants Index
 * Centralized exports of all constant modules for easy importing
 * 
 * Usage:
 *   import { PORTS, TIMEOUTS, SKILL_LEVELS } from '../constants/index.js';
 * 
 * Or import specific module:
 *   import { getTokenBudget } from '../constants/ai.constants.js';
 */

// Configuration
export {
  PORTS,
  DATABASE,
  SERVICE_URLS,
  CORS,
  TIMEOUTS,
  CACHE,
  FEATURES,
  UPLOADS,
  LIMITS,
  API,
} from './config.constants.js';

// Scoring & Levels
export {
  SCORE_THRESHOLDS_BASE,
  SCORE_THRESHOLDS_BOOSTED,
  TECHNICAL_LEVEL_THRESHOLDS,
  PSYCHOMETRIC_THRESHOLDS,
  SKILL_BOOST,
  SKILL_LEVELS,
  classifyBaseLevel,
  classifyBoostedLevel,
  getTechnicalLevel,
  classifyPsychometricLevel,
} from './scoring.constants.js';

// Error Messages
export {
  VALIDATION_ERRORS,
  NOT_FOUND_ERRORS,
  CONFIG_ERRORS,
  PROCESSING_ERRORS,
  NETWORK_ERRORS,
  GENERIC_ERRORS,
  SUCCESS_MESSAGES,
  createValidationError,
  createNotFoundError,
  createServerError,
} from './errors.constants.js';

// AI Models & Tokens
export {
  AI_MODELS,
  TOKEN_BUDGETS,
  LEARNING,
  SYSTEM_PROMPTS,
  PROMPT_TEMPLATES,
  getTokenBudget,
} from './ai.constants.js';
