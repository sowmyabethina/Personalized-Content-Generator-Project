/**
 * Error Handler Utility
 * Centralized error handling functions
 */

const { logError } = require('./logger');

/**
 * Custom API Error class
 */
class ApiError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

/**
 * Handle errors in route handlers
 * @param {Error} err - Error object
 * @param {string} endpoint - Endpoint where error occurred
 * @returns {Object} - Error response object { status, error, message }
 */
function handleError(err, endpoint) {
  const message = err && err.message ? err.message : String(err);
  
  logError(`${endpoint} error:`, err);
  
  // Handle specific error types
  if (message.toLowerCase().includes('not enough content')) {
    return { 
      status: 400, 
      error: 'not_enough_content', 
      message: 'Document too short for question generation.' 
    };
  }
  
  if (message.includes('Too Many Requests') || message.toLowerCase().includes('quota')) {
    return {
      status: 429,
      error: 'rate_limit',
      message: 'External AI quota exceeded. Try again later.'
    };
  }
  
  if (err.name === 'ApiError') {
    return { status: err.status, error: err.message, message: err.message };
  }
  
  return { status: 500, error: 'Internal Server Error', message };
}

/**
 * Express error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function errorMiddleware(err, req, res, next) {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

/**
 * Not found handler middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function notFoundMiddleware(req, res) {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
}

/**
 * Async wrapper to catch errors in route handlers
 * @param {Function} fn - Async route handler function
 * @returns {Function} - Wrapped function with error handling
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  ApiError,
  handleError,
  errorMiddleware,
  notFoundMiddleware,
  asyncHandler
};