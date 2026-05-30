CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER NOT NULL,
  action VARCHAR(20) NOT NULL,
  description VARCHAR(500),
  user_id INTEGER,
  user_name VARCHAR(191),
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_activity_log_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity_time ON activity_logs(entity_type, entity_id, created_at);
