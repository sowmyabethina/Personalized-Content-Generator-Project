/**
 * Agent Monitor - Activity tracking and logging for AI agent behavior
 * 
 * Provides structured logging for monitoring how the AI agent processes requests
 * and tracks performance metrics.
 */

/**
 * Log an agent event with structured output
 * @param {string} eventType - Type of event (e.g., "USER_MESSAGE_RECEIVED")
 * @param {string} details - Additional details about the event
 */
export function logAgentEvent(eventType, details = "") {
  const timestamp = new Date().toISOString();
  
  console.log("==============================");
  console.log("[AI AGENT EVENT]");
  console.log(`Time: ${timestamp}`);
  console.log(`Event: ${eventType}`);
  if (details) {
    console.log(`Details: ${details}`);
  }
  console.log("==============================");
}

export default { logAgentEvent };
