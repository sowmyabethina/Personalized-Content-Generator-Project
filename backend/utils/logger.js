/**
 * Logger Utility
 * Centralized logging functions
 */

/**
 * Log info message
 * @param {string} message - Message to log
 * @param {...any} args - Additional arguments
 */
function log(message, ...args) {
  console.log(message, ...args);
}

/**
 * Log success message
 * @param {string} message - Success message to log
 */
function logSuccess(message) {
  console.log(`✅ ${message}`);
}

/**
 * Log error message
 * @param {string} message - Error message to log
 * @param {Error} [error] - Optional error object
 */
function logError(message, error) {
  if (error) {
    console.error(`❌ ${message}:`, error.message);
  } else {
    console.error(`❌ ${message}`);
  }
}

/**
 * Log debug message (only in development)
 * @param {string} message - Debug message to log
 * @param {...any} args - Additional arguments
 */
function logDebug(message, ...args) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🔍 DEBUG - ${message}`, ...args);
  }
}

/**
 * Log incoming request
 * @param {string} endpoint - Endpoint being called
 * @param {any} [data] - Optional request data
 */
function logRequest(endpoint, data) {
  console.log(`📥 ${endpoint} called`, data ? JSON.stringify(data).substring(0, 200) : '');
}

/**
 * Log outgoing response
 * @param {string} endpoint - Endpoint response
 * @param {number} [status] - Response status code
 */
function logResponse(endpoint, status) {
  console.log(`📤 ${endpoint} response status:`, status);
}

export { log, logSuccess, logError, logDebug, logRequest, logResponse };
export default { log, logSuccess, logError, logDebug, logRequest, logResponse };
