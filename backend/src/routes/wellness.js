import express from 'express';
const router = express.Router();
import wellnessController from '../controllers/wellnessController.js';
import { validateWellnessEntry } from '../middleware/validator.js';
import { authenticate } from '../middleware/auth.js';

// GET /api/wellness/context/:userId - User wellness context
router.get('/context/:userId', authenticate, wellnessController.getWellnessContext);

// POST /api/wellness/entries - Create wellness entry
router.post('/entries', authenticate, validateWellnessEntry, wellnessController.createWellnessEntry);

// GET /api/wellness/entries/:userId - Get wellness entries for user
router.get('/entries/:userId', authenticate, wellnessController.getWellnessEntries);

// GET /api/wellness/analytics/:userId - Get wellness analytics for user
router.get('/analytics/:userId', authenticate, wellnessController.getWellnessAnalytics);

export default router;