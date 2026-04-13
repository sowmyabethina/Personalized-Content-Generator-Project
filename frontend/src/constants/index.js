/**
 * Frontend Constants Index
 * Centralized exports of all constant modules for easy importing
 * 
 * Usage:
 *   import { ANIMATIONS, DELAYS, ERROR_MESSAGES } from '../constants/index.js';
 */

// Configuration
export {
  ANIMATIONS,
  DELAYS,
  SCORE_VISUAL,
  LIMITS,
  API_TIMEOUTS,
  PAGES,
  STORAGE_KEYS,
  INPUT_TYPES,
} from './config.constants.js';

// Error & Status Messages
export {
  ERROR_MESSAGES,
  VALIDATION_MESSAGES,
  SUCCESS_MESSAGES,
  INFO_MESSAGES,
  WARNING_MESSAGES,
  BUTTON_LABELS,
  PLACEHOLDERS,
  LOADING_STATES,
} from './errors.constants.js';
