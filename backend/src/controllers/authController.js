import databaseService from '../services/databaseService.js';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

// Register a new user
async function register(req, res, next) {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    logger.info(`Registration attempt for email: ${email}`);
    
    // Check if user already exists
    const existingUser = await databaseService.getUserByEmail(email);
    
    if (existingUser) {
      logger.warn(`Registration failed: Email ${email} already in use`);
      return res.status(400).json({
        message: 'Email already in use'
      });
    }
    
    // Create new user
    const user = await databaseService.createUser(email, password, firstName, lastName);
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    logger.info(`User registered successfully: ${email}`);
    
    // Return user data and token
    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      },
      token
    });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    next(error);
  }
}

// Login user
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    
    logger.info(`Login attempt for email: ${email}`);
    
    // Verify user credentials
    const user = await databaseService.verifyUser(email, password);
    
    if (!user) {
      logger.warn(`Login failed: Invalid credentials for ${email}`);
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    logger.info(`User logged in successfully: ${email}`);
    
    // Return user data and token
    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      },
      token
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    next(error);
  }
}

// Get current user profile
async function getProfile(req, res, next) {
  try {
    const userId = req.user.id;
    
    logger.info(`Getting profile for user ID: ${userId}`);
    
    // Get user by email
    const user = await databaseService.getUserByEmail(req.user.email);
    
    if (!user) {
      logger.warn(`Profile not found for user ID: ${userId}`);
      return res.status(404).json({
        message: 'User not found'
      });
    }
    
    // Return user data
    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    logger.error(`Get profile error: ${error.message}`);
    next(error);
  }
}

export default {
  register,
  login,
  getProfile
};