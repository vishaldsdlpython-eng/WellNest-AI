import express from 'express';
const router = express.Router();
import chatController from '../controllers/chatController.js';
import { validateChatMessage } from '../middleware/validator.js';
import { chatLimiter } from '../middleware/rateLimiter.js';
import { authenticate } from '../middleware/auth.js';

// POST /api/chat/send - Main chat endpoint
router.post('/send', authenticate, chatLimiter, validateChatMessage, chatController.sendMessage);

// GET /api/chat/history/:userId - Conversation history
router.get('/history/:userId', authenticate, chatController.getChatHistory);

// POST /api/chat/crisis-check - Crisis detection endpoint
router.post('/crisis-check', authenticate, validateChatMessage, chatController.checkCrisis);

export default router;