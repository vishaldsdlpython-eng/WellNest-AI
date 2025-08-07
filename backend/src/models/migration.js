import pool from './database.js';
import logger from '../utils/logger.js';

async function runMigration() {
  const client = await pool.connect();
  
  try {
    logger.info('Starting database migration...');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Update chat_messages table with new columns
    await client.query(`
      ALTER TABLE chat_messages 
      ADD COLUMN IF NOT EXISTS crisis_detected BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS crisis_keywords TEXT,
      ADD COLUMN IF NOT EXISTS crisis_confidence DECIMAL(3,2),
      ADD COLUMN IF NOT EXISTS session_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS response_time INTEGER
    `);
    
    // Create crisis_events table
    await client.query(`
      CREATE TABLE IF NOT EXISTS crisis_events (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        keywords TEXT,
        confidence DECIMAL(3,2),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved BOOLEAN DEFAULT FALSE,
        resolved_at TIMESTAMP,
        notes TEXT
      )
    `);
    
    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_crisis_events_user_id ON crisis_events(user_id);
      CREATE INDEX IF NOT EXISTS idx_crisis_events_timestamp ON crisis_events(timestamp);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_crisis ON chat_messages(crisis_detected);
    `);
    
    // Commit transaction
    await client.query('COMMIT');
    
    logger.info('Database migration completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error(`Migration failed: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
