/**
 * Auth Middleware - Consolidated
 * Handles Clerk authentication for all routes
 */

/**
 * Clerk authentication middleware
 * Extracts user ID from headers and allows both authenticated and anonymous access
 * 
 * Sets req.userId to:
 * - From x-user-id header if provided
 * - 'authenticated_user' for Bearer token requests
 * - 'anonymous' for unauthenticated requests
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
export const clerkAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  // Allow requests without auth for development
  if (!authHeader) {
    req.userId = req.headers['x-user-id'] || 'anonymous';
    return next();
  }
  
  // Basic validation
  if (authHeader.startsWith('Bearer ')) {
    req.userId = req.headers['x-user-id'] || 'authenticated_user';
    return next();
  }
  
  return res.status(401).json({ error: 'Unauthorized' });
};

export default { clerkAuth };
