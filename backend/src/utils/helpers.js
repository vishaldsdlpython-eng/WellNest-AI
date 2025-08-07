import crypto from 'crypto';

/**
 * Generate a unique session ID
 */
const generateSessionId = () => {
  return crypto.randomUUID();
};

/**
 * Calculate response time in milliseconds
 */
const calculateResponseTime = (startTime) => {
  const endTime = process.hrtime.bigint();
  return Number(endTime - startTime) / 1000000; // Convert to milliseconds
};

/**
 * Sanitize user input to prevent injection attacks
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .replace(/[\<\>\&\"\\'\`]/g, '') // Remove potentially dangerous characters
    .trim();
};

export {
  generateSessionId,
  calculateResponseTime,
  sanitizeInput
};