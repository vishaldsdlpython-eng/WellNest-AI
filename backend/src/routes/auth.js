import express from 'express';
const router = express.Router();
import authController from '../controllers/authController.js';
import { validateRegistration, validateLogin } from '../middleware/validator.js';
import { authenticate } from '../middleware/auth.js';

// POST /api/auth/register - Register a new user
router.post('/register', validateRegistration, authController.register);

// POST /api/auth/login - Login user
router.post('/login', validateLogin, authController.login);

// GET /api/auth/profile - Get current user profile (protected route)
router.get('/profile', authenticate, authController.getProfile);

export default router;