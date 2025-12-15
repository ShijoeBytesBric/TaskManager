-- init.sql
-- We do not need CREATE DATABASE or \c here because Docker does this via env vars

CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);

INSERT INTO tasks (title, description, completed) VALUES
('Setup AWS Infrastructure', 'Create VPC, subnets, and security groups', false),
('Configure CI/CD Pipeline', 'Setup GitHub Actions for automated deployments', true),
('Deploy to Kubernetes', 'Create Kubernetes manifests and deploy application', false);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON tasks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();