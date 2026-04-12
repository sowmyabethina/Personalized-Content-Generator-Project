/**
 * Config barrel — import from `../config/index.js` or specific modules.
 */
export { initDatabase } from "./database.js";
export {
  appConfig,
  getCorsAllowedOrigins,
  getBackendPublicUrl,
  getRagServiceUrl,
} from "./app.config.js";
export { GROQ_MODEL_PRIMARY, GROQ_MODEL_FALLBACK } from "./ai.models.js";
