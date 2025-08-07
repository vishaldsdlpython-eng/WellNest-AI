import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

// Authentication middleware
const authenticate = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Authentication failed: No token provided');
      return res.status(401).json({
        message: 'Authentication required'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user data to request
    req.user = {
      id: decoded.id,
      email: decoded.email
    };
    
    next();
  } catch (error) {
    logger.warn(`Authentication failed: ${error.message}`);
    res.status(401).json({
      message: 'Authentication failed'
    });
  }
};

export {
  authenticate
};