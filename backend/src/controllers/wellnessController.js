import databaseService from '../services/databaseService.js';
import logger from '../utils/logger.js';
import { sanitizeInput } from '../utils/helpers.js';

// Get user wellness context
async function getWellnessContext(req, res, next) {
  try {
    const { userId } = req.params;
    
    logger.info(`Getting wellness context for user ${userId}`);
    
    const wellnessContext = await databaseService.getWellnessContext(userId);
    
    if (!wellnessContext) {
      return res.status(404).json({
        message: 'No wellness data found for this user'
      });
    }
    
    res.status(200).json(wellnessContext);
  } catch (error) {
    logger.error(`Error getting wellness context: ${error.message}`);
    next(error);
  }
}

// Create wellness entry
async function createWellnessEntry(req, res, next) {
  try {
    const userId = req.user.id; // From auth middleware
    const entryData = {
      userId,
      moodRating: req.body.moodRating,
      energyLevel: req.body.energyLevel,
      stressLevel: req.body.stressLevel,
      sleepHours: req.body.sleepHours,
      sleepQuality: req.body.sleepQuality,
      notes: sanitizeInput(req.body.notes || '')
    };
    
    logger.info(`Creating wellness entry for user ${userId}`);
    
    const newEntry = await databaseService.createWellnessEntry(entryData);
    
    res.status(201).json(newEntry);
  } catch (error) {
    logger.error(`Error creating wellness entry: ${error.message}`);
    next(error);
  }
}

// Get wellness entries for user
async function getWellnessEntries(req, res, next) {
  try {
    const { userId } = req.params;
    
    logger.info(`Getting wellness entries for user ${userId}`);
    
    const entries = await databaseService.getWellnessEntries(userId);
    
    res.status(200).json({ entries });
  } catch (error) {
    logger.error(`Error getting wellness entries: ${error.message}`);
    next(error);
  }
}

// Get wellness analytics for user
async function getWellnessAnalytics(req, res, next) {
  try {
    const { userId } = req.params;
    
    logger.info(`Getting wellness analytics for user ${userId}`);
    
    const entries = await databaseService.getWellnessEntries(userId);
    
    // Calculate analytics
    if (!entries || entries.length === 0) {
      return res.status(200).json({
        entries: [],
        summary: {
          averageMood: 0,
          averageEnergy: 0,
          averageSleep: 0,
          averageStress: 0,
          totalEntries: 0
        }
      });
    }
    
    // Calculate averages
    const averageMood = entries.reduce((sum, entry) => sum + entry.moodRating, 0) / entries.length;
    const averageEnergy = entries.reduce((sum, entry) => sum + entry.energyLevel, 0) / entries.length;
    const averageSleep = entries.reduce((sum, entry) => sum + entry.sleepHours, 0) / entries.length;
    const averageStress = entries.reduce((sum, entry) => sum + entry.stressLevel, 0) / entries.length;
    
    // Calculate trends (comparing last 2 entries if available)
    let trendMood = null;
    let trendEnergy = null;
    let trendSleep = null;
    let trendStress = null;
    
    if (entries.length >= 2) {
      // Sort entries by date (newest first)
      const sortedEntries = [...entries].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      const latest = sortedEntries[0];
      const previous = sortedEntries[1];
      
      trendMood = latest.moodRating - previous.moodRating;
      trendEnergy = latest.energyLevel - previous.energyLevel;
      trendSleep = latest.sleepHours - previous.sleepHours;
      trendStress = latest.stressLevel - previous.stressLevel;
    }
    
    // Format the response to match what the frontend expects
    res.status(200).json({
      entries: entries.map(entry => ({
        date: new Date(entry.entryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        mood: entry.moodRating,
        energy: entry.energyLevel,
        sleep: entry.sleepHours || 0,
        stress: entry.stressLevel
      })),
      summary: {
        averageMood,
        averageEnergy,
        averageSleep,
        averageStress,
        totalEntries: entries.length
      }
    });
  } catch (error) {
    logger.error(`Error getting wellness analytics: ${error.message}`);
    next(error);
  }
}

export default {
  getWellnessContext,
  createWellnessEntry,
  getWellnessEntries,
  getWellnessAnalytics
};