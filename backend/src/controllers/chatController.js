import geminiAiService from '../services/geminiAiService.js';
import crisisDetectionService from '../services/crisisDetectionService.js';
import databaseService from '../services/databaseService.js';
import logger from '../utils/logger.js';
import { generateSessionId, calculateResponseTime } from '../utils/helpers.js';

// Main chat endpoint
async function sendMessage(req, res, next) {
  const startTime = process.hrtime.bigint();
  try {
    const { message, userId, sessionId = generateSessionId() } = req.body;
    
    logger.info(`Chat request from user ${userId}`);
    
    // Check for crisis indicators
    const crisisCheck = crisisDetectionService.detectCrisis(message);
    
    // Log user message to database
    await databaseService.createChatMessage({
      userId,
      content: message,
      sender: 'user',
      sessionId,
      crisisDetected: crisisCheck.isCrisis,
      crisisKeywords: crisisCheck.keywords.join(','),
      crisisConfidence: crisisCheck.confidence,
      responseTime: 0 // User messages don't have response time
    });
    
    // Get chat history for context
    const chatHistory = await databaseService.getChatHistory(userId, 10);
    const conversationHistory = geminiAiService.convertChatHistory(chatHistory.reverse());
    
    // Get user wellness context
    const userContext = await databaseService.getWellnessContext(userId);
    
    // If crisis detected, send crisis response
    let aiResponse;
    if (crisisCheck.isCrisis && crisisCheck.confidence > 0.7) {
      aiResponse = {
        content: crisisDetectionService.getCrisisResponse(),
        responseTime: calculateResponseTime(startTime)
      };
      
      // Log crisis event
      await databaseService.logCrisisEvent(userId, message, crisisCheck.keywords, crisisCheck.confidence);
    } else {
      // Generate AI response
      aiResponse = await geminiAiService.generateResponse(message, conversationHistory, userContext, userId);
    }
    
    // Log bot response to database
    const botMessage = await databaseService.createChatMessage({
      userId,
      content: aiResponse.content,
      sender: 'bot',
      sessionId,
      crisisDetected: false,
      crisisKeywords: '',
      crisisConfidence: 0,
      responseTime: aiResponse.responseTime
    });
    
    // Send response
    res.status(200).json({
      message: botMessage,
      sessionId,
      crisisDetected: crisisCheck.isCrisis,
      responseTime: aiResponse.responseTime
    });
    
    logger.info(`Response sent to user ${userId} in ${aiResponse.responseTime}ms`);
  } catch (error) {
    logger.error(`Error in chat controller: ${error.message}`);
    next(error);
  }
}

// Get chat history
async function getChatHistory(req, res, next) {
  try {
    const { userId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    
    logger.info(`Getting chat history for user ${userId}`);
    
    const chatHistory = await databaseService.getChatHistory(userId, limit);
    
    res.status(200).json({
      messages: chatHistory,
      count: chatHistory.length
    });
  } catch (error) {
    logger.error(`Error getting chat history: ${error.message}`);
    next(error);
  }
}

// Crisis check endpoint
async function checkCrisis(req, res, next) {
  try {
    const { message, userId } = req.body;
    
    logger.info(`Crisis check for user ${userId}`);
    
    const crisisCheck = crisisDetectionService.detectCrisis(message);
    
    if (crisisCheck.isCrisis) {
      await databaseService.logCrisisEvent(userId, message, crisisCheck.keywords, crisisCheck.confidence);
    }
    
    res.status(200).json({
      isCrisis: crisisCheck.isCrisis,
      confidence: crisisCheck.confidence,
      keywords: crisisCheck.keywords,
      response: crisisCheck.isCrisis ? crisisDetectionService.getCrisisResponse() : null
    });
  } catch (error) {
    logger.error(`Error in crisis check: ${error.message}`);
    next(error);
  }
}

export default {
  sendMessage,
  getChatHistory,
  checkCrisis
};