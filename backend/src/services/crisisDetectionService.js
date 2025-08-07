import axios from 'axios';
import logger from '../utils/logger.js';

class CrisisDetectionService {
  constructor() {
    this.crisisKeywords = [
      'suicide', 'kill myself', 'end it all', 'want to die', 'hurt myself', 
      'self harm', 'can\'t go on', 'hopeless', 'worthless', 'better off dead', 
      'nobody cares', 'give up', 'end my life', 'suicidal thoughts', 
      'cutting', 'overdose'
    ];
    
    this.crisisWebhookUrl = process.env.CRISIS_WEBHOOK_URL;
  }

  detectCrisis(message) {
    const lowerMessage = message.toLowerCase();
    let detectedKeywords = [];
    let highestConfidence = 0;
    
    // Check for exact matches
    this.crisisKeywords.forEach(keyword => {
      if (lowerMessage.includes(keyword)) {
        detectedKeywords.push(keyword);
        // Simple confidence scoring based on keyword presence and message length
        // Higher confidence for shorter messages with crisis keywords
        const keywordLength = keyword.length;
        const messageLength = lowerMessage.length;
        const confidence = Math.min(0.95, keywordLength / messageLength + 0.5);
        highestConfidence = Math.max(highestConfidence, confidence);
      }
    });
    
    // Check for patterns that might indicate crisis
    const patterns = [
      { regex: /i (can'?t|cannot) (take|handle|deal with) (it|this) anymore/i, confidence: 0.85 },
      { regex: /no (reason|point) (in|to) living/i, confidence: 0.9 },
      { regex: /no one would (care|notice|mind) if i was gone/i, confidence: 0.85 },
      { regex: /i'?m (just|such) a burden/i, confidence: 0.7 },
      { regex: /i'?ve (tried|been trying) everything/i, confidence: 0.6 },
      { regex: /i (just )?want the pain to (stop|end)/i, confidence: 0.8 }
    ];
    
    patterns.forEach(pattern => {
      if (pattern.regex.test(lowerMessage)) {
        detectedKeywords.push(pattern.regex.toString().replace(/[/\\^$*+?.()|[\]{}]/g, ''));
        highestConfidence = Math.max(highestConfidence, pattern.confidence);
      }
    });
    
    const isCrisis = detectedKeywords.length > 0;
    
    if (isCrisis) {
      logger.warn(`Crisis detected with confidence ${highestConfidence}: ${detectedKeywords.join(', ')}`);
      this._notifyCrisis(message, detectedKeywords, highestConfidence);
    }
    
    return {
      isCrisis,
      confidence: highestConfidence,
      keywords: detectedKeywords
    };
  }

  getCrisisResponse() {
    return `I notice you're expressing some concerning thoughts. Your wellbeing is important, and immediate support is available:

**National Suicide Prevention Lifeline**: Call 988
**Crisis Text Line**: Text HOME to 741741
**Emergency Services**: Call 911

These services are available 24/7 and staffed by trained professionals who care and want to help. Please reach out to them now.

Would it be okay if we continue our conversation while you also connect with one of these resources?`;
  }

  async _notifyCrisis(message, keywords, confidence) {
    // Only send webhook if URL is configured
    if (!this.crisisWebhookUrl) {
      logger.info('Crisis webhook URL not configured, skipping notification');
      return;
    }
    
    try {
      await axios.post(this.crisisWebhookUrl, {
        message,
        keywords,
        confidence,
        timestamp: new Date().toISOString()
      });
      logger.info('Crisis notification sent successfully');
    } catch (error) {
      logger.error(`Failed to send crisis notification: ${error.message}`);
    }
  }
}

export default new CrisisDetectionService();