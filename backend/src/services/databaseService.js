import pool from '../models/database.js';
import logger from '../utils/logger.js';
import bcrypt from 'bcrypt';

class DatabaseService {
  // User operations
  async createUser(email, password, firstName, lastName) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const result = await pool.query(
        'INSERT INTO users (email, first_name, last_name, password_hash) VALUES ($1, $2, $3, $4) RETURNING *',
        [email, firstName, lastName, hashedPassword]
      );
      
      const user = result.rows[0];
      return {
        id: user.id.toString(),
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        createdAt: user.created_at
      };
    } catch (error) {
      logger.error(`Error creating user: ${error.message}`);
      throw error;
    }
  }

  async getUserByEmail(email) {
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const user = result.rows[0];
      return {
        id: user.id.toString(),
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        createdAt: user.created_at
      };
    } catch (error) {
      logger.error(`Error getting user by email: ${error.message}`);
      throw error;
    }
  }

  async verifyUser(email, password) {
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const user = result.rows[0];
      const isValid = await bcrypt.compare(password, user.password_hash);
      
      if (!isValid) {
        return null;
      }
      
      return {
        id: user.id.toString(),
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        createdAt: user.created_at
      };
    } catch (error) {
      logger.error(`Error verifying user: ${error.message}`);
      throw error;
    }
  }

  // Chat messages operations
  async createChatMessage(message) {
    try {
      const { userId, content, sender, sessionId, crisisDetected, crisisKeywords, crisisConfidence, responseTime } = message;
      
      const result = await pool.query(
        `INSERT INTO chat_messages 
         (user_id, content, sender, session_id, crisis_detected, crisis_keywords, crisis_confidence, response_time) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING *`,
        [userId, content, sender, sessionId, crisisDetected, crisisKeywords, crisisConfidence, responseTime]
      );
      
      const dbMessage = result.rows[0];
      return {
        id: dbMessage.id.toString(),
        userId: dbMessage.user_id.toString(),
        content: dbMessage.content,
        sender: dbMessage.sender,
        sessionId: dbMessage.session_id,
        crisisDetected: dbMessage.crisis_detected,
        crisisKeywords: dbMessage.crisis_keywords,
        crisisConfidence: dbMessage.crisis_confidence,
        responseTime: dbMessage.response_time,
        timestamp: dbMessage.timestamp
      };
    } catch (error) {
      logger.error(`Error creating chat message: ${error.message}`);
      throw error;
    }
  }

  async getChatHistory(userId, limit = 50) {
    try {
      const result = await pool.query(
        'SELECT * FROM chat_messages WHERE user_id = $1 ORDER BY timestamp DESC LIMIT $2',
        [userId, limit]
      );
      
      return result.rows.map(row => ({
        id: row.id.toString(),
        userId: row.user_id.toString(),
        content: row.content,
        sender: row.sender,
        sessionId: row.session_id,
        crisisDetected: row.crisis_detected,
        crisisKeywords: row.crisis_keywords,
        crisisConfidence: row.crisis_confidence,
        responseTime: row.response_time,
        timestamp: row.timestamp
      }));
    } catch (error) {
      logger.error(`Error getting chat history: ${error.message}`);
      throw error;
    }
  }

  // Wellness entries operations
  async createWellnessEntry(entry) {
    try {
      // Create a new Date object with current timestamp to ensure uniqueness
      const now = new Date();
      
      // Check if an entry already exists for this user on this date
      const existingEntry = await pool.query(
        `SELECT id FROM wellness_entries 
         WHERE user_id = $1 AND DATE(entry_date) = DATE($2)`,
        [entry.userId, entry.entryDate || now]
      );
      
      // If an entry exists for today, update it instead of creating a new one
      if (existingEntry.rows.length > 0) {
        const entryId = existingEntry.rows[0].id;
        logger.info(`Updating existing wellness entry ${entryId} for user ${entry.userId}`);
        
        const result = await pool.query(
          `UPDATE wellness_entries 
           SET mood_rating = $1, energy_level = $2, sleep_hours = $3, 
               sleep_quality = $4, stress_level = $5, water_intake = $6, 
               exercise_minutes = $7, notes = $8, ai_insights = $9, updated_at = NOW()
           WHERE id = $10
           RETURNING *`,
          [
            entry.moodRating,
            entry.energyLevel,
            entry.sleepHours,
            entry.sleepQuality,
            entry.stressLevel,
            entry.waterIntake || 0,
            entry.exerciseMinutes || 0,
            entry.notes || '',
            entry.aiInsights || '',
            entryId
          ]
        );
        
        const dbEntry = result.rows[0];
        return {
          id: dbEntry.id.toString(),
          userId: dbEntry.user_id.toString(),
          entryDate: dbEntry.entry_date,
          moodRating: dbEntry.mood_rating,
          energyLevel: dbEntry.energy_level,
          sleepHours: dbEntry.sleep_hours,
          sleepQuality: dbEntry.sleep_quality,
          stressLevel: dbEntry.stress_level,
          waterIntake: dbEntry.water_intake,
          exerciseMinutes: dbEntry.exercise_minutes,
          notes: dbEntry.notes,
          aiInsights: dbEntry.ai_insights
        };
      }
      
      // Otherwise, create a new entry
      const result = await pool.query(
        `INSERT INTO wellness_entries 
         (user_id, entry_date, mood_rating, energy_level, sleep_hours, sleep_quality, stress_level, water_intake, exercise_minutes, notes, ai_insights)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          entry.userId,
          entry.entryDate || now,
          entry.moodRating,
          entry.energyLevel,
          entry.sleepHours,
          entry.sleepQuality,
          entry.stressLevel,
          entry.waterIntake || 0,
          entry.exerciseMinutes || 0,
          entry.notes || '',
          entry.aiInsights || ''
        ]
      );
      
      const dbEntry = result.rows[0];
      return {
        id: dbEntry.id.toString(),
        userId: dbEntry.user_id.toString(),
        entryDate: dbEntry.entry_date,
        moodRating: dbEntry.mood_rating,
        energyLevel: dbEntry.energy_level,
        sleepHours: dbEntry.sleep_hours,
        sleepQuality: dbEntry.sleep_quality,
        stressLevel: dbEntry.stress_level,
        waterIntake: dbEntry.water_intake,
        exerciseMinutes: dbEntry.exercise_minutes,
        notes: dbEntry.notes,
        aiInsights: dbEntry.ai_insights
      };
    } catch (error) {
      logger.error(`Error creating wellness entry: ${error.message}`);
      throw error;
    }
  }

  async getWellnessEntries(userId) {
    try {
      const result = await pool.query(
        'SELECT * FROM wellness_entries WHERE user_id = $1 ORDER BY entry_date DESC',
        [userId]
      );
      
      return result.rows.map(row => ({
        id: row.id.toString(),
        userId: row.user_id.toString(),
        entryDate: row.entry_date,
        moodRating: row.mood_rating,
        energyLevel: row.energy_level,
        sleepHours: row.sleep_hours,
        sleepQuality: row.sleep_quality,
        stressLevel: row.stress_level,
        waterIntake: row.water_intake,
        exerciseMinutes: row.exercise_minutes,
        notes: row.notes,
        aiInsights: row.ai_insights
      }));
    } catch (error) {
      logger.error(`Error getting wellness entries: ${error.message}`);
      throw error;
    }
  }

  async getWellnessContext(userId) {
    try {
      // Get the most recent wellness entry
      const result = await pool.query(
        'SELECT * FROM wellness_entries WHERE user_id = $1 ORDER BY entry_date DESC LIMIT 1',
        [userId]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const entry = result.rows[0];
      return {
        moodRating: entry.mood_rating,
        energyLevel: entry.energy_level,
        sleepHours: entry.sleep_hours,
        sleepQuality: entry.sleep_quality,
        stressLevel: entry.stress_level,
        notes: entry.notes
      };
    } catch (error) {
      logger.error(`Error getting wellness context: ${error.message}`);
      throw error;
    }
  }

  async logCrisisEvent(userId, message, keywords, confidence) {
    try {
      await pool.query(
        `INSERT INTO crisis_events 
         (user_id, message, keywords, confidence, timestamp) 
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
        [userId, message, keywords.join(','), confidence]
      );
      
      logger.info(`Crisis event logged for user ${userId}`);
      return true;
    } catch (error) {
      logger.error(`Error logging crisis event: ${error.message}`);
      throw error;
    }
  }
}

export default new DatabaseService();