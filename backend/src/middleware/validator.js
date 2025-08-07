import { body, validationResult } from 'express-validator';
import { sanitizeInput } from '../utils/helpers.js';
import logger from '../utils/logger.js';

// Middleware to validate chat messages
const validateChatMessage = [
  body('message')
    .trim()
    .notEmpty().withMessage('Message cannot be empty')
    .isString().withMessage('Message must be a string')
    .isLength({ max: 1000 }).withMessage('Message cannot exceed 1000 characters')
    .customSanitizer(sanitizeInput),
  
  body('userId')
    .trim()
    .notEmpty().withMessage('User ID is required')
    .isString().withMessage('User ID must be a string'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Middleware to validate wellness entry
const validateWellnessEntry = [
  body('moodRating')
    .optional()
    .isInt({ min: 1, max: 10 }).withMessage('Mood rating must be between 1 and 10'),
  
  body('energyLevel')
    .optional()
    .isInt({ min: 1, max: 10 }).withMessage('Energy level must be between 1 and 10'),
  
  body('stressLevel')
    .optional()
    .isInt({ min: 1, max: 10 }).withMessage('Stress level must be between 1 and 10'),
  
  body('sleepHours')
    .optional()
    .isFloat({ min: 0, max: 24 }).withMessage('Sleep hours must be between 0 and 24'),
  
  body('sleepQuality')
    .optional()
    .isInt({ min: 1, max: 10 }).withMessage('Sleep quality must be between 1 and 10'),
  
  body('notes')
    .optional()
    .isString().withMessage('Notes must be a string')
    .isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters')
    .customSanitizer(sanitizeInput),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Middleware to validate user registration
const validateRegistration = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address'),
  
  body('password')
    .trim()
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isString().withMessage('First name must be a string')
    .customSanitizer(sanitizeInput),
  
  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isString().withMessage('Last name must be a string')
    .customSanitizer(sanitizeInput),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn(`Registration validation failed: ${JSON.stringify(errors.array())}`);
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }
    next();
  }
];

// Middleware to validate user login
const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address'),
  
  body('password')
    .trim()
    .notEmpty().withMessage('Password is required'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn(`Login validation failed: ${JSON.stringify(errors.array())}`);
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }
    next();
  }
];

export {
  validateChatMessage,
  validateWellnessEntry,
  validateRegistration,
  validateLogin
};