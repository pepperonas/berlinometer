-- Datenfestung Database Schema
-- PostgreSQL Database Schema for Privacy Management Software

-- Users and Authentication
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'user', -- 'admin', 'dpo', 'user'
    organization_id INTEGER,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Organizations/Companies
CREATE TABLE organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    dpo_name VARCHAR(255),
    dpo_email VARCHAR(255),
    dpo_phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Processing Activities (VVT - Verzeichnis von Verarbeitungstätigkeiten)
CREATE TABLE processing_activities (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    purpose TEXT NOT NULL,
    legal_basis VARCHAR(100) NOT NULL, -- Art. 6 DSGVO
    data_categories TEXT[], -- Array of data categories
    data_subjects TEXT[], -- Array of data subject categories
    recipients TEXT[], -- Array of recipients
    third_country_transfers BOOLEAN DEFAULT false,
    third_country_details TEXT,
    retention_period VARCHAR(255),
    retention_criteria TEXT,
    is_joint_processing BOOLEAN DEFAULT false,
    joint_controllers TEXT,
    tom_ids INTEGER[], -- Array of TOM IDs
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'draft'
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Technical and Organizational Measures (TOM)
CREATE TABLE toms (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'technical', 'organizational'
    measures TEXT NOT NULL,
    implementation_date DATE,
    review_date DATE,
    responsible_person VARCHAR(255),
    status VARCHAR(50) DEFAULT 'implemented', -- 'planned', 'implemented', 'reviewed'
    is_template BOOLEAN DEFAULT false,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contracts for Data Processing (AVV - Auftragsverarbeitungsverträge)
CREATE TABLE contracts (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id),
    contractor_name VARCHAR(255) NOT NULL,
    contractor_address TEXT,
    contractor_email VARCHAR(255),
    contract_type VARCHAR(100) DEFAULT 'data_processing', -- 'data_processing', 'joint_controller'
    contract_start_date DATE NOT NULL,
    contract_end_date DATE,
    contract_summary TEXT,
    file_path VARCHAR(500), -- Path to uploaded PDF
    file_name VARCHAR(255),
    reminder_days_before INTEGER DEFAULT 30,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'expired', 'terminated'
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks and Tickets
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(100) NOT NULL, -- 'data_request', 'breach_response', 'review', 'other'
    priority VARCHAR(50) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'completed', 'cancelled'
    assigned_to INTEGER REFERENCES users(id),
    due_date DATE,
    completed_at TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- E-Learning Courses
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_type VARCHAR(50), -- 'video', 'document', 'quiz'
    file_path VARCHAR(500),
    file_name VARCHAR(255),
    duration_minutes INTEGER,
    is_mandatory BOOLEAN DEFAULT false,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Course Progress
CREATE TABLE user_course_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    course_id INTEGER REFERENCES courses(id),
    status VARCHAR(50) DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed'
    progress_percentage INTEGER DEFAULT 0,
    completed_at TIMESTAMP,
    score INTEGER, -- Quiz score if applicable
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, course_id)
);

-- Quiz Questions
CREATE TABLE quiz_questions (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id),
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of possible answers
    correct_answer INTEGER NOT NULL, -- Index of correct answer
    explanation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id),
    user_id INTEGER REFERENCES users(id),
    type VARCHAR(100) NOT NULL, -- 'contract_expiry', 'task_due', 'system_alert'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    related_entity_type VARCHAR(100), -- 'contract', 'task', 'processing_activity'
    related_entity_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Log
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id),
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete', 'login'
    entity_type VARCHAR(100) NOT NULL, -- 'processing_activity', 'tom', 'contract', etc.
    entity_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key for organization_id in users table
ALTER TABLE users ADD CONSTRAINT fk_users_organization 
    FOREIGN KEY (organization_id) REFERENCES organizations(id);

-- Create indexes for better performance
CREATE INDEX idx_processing_activities_organization ON processing_activities(organization_id);
CREATE INDEX idx_toms_organization ON toms(organization_id);
CREATE INDEX idx_contracts_organization ON contracts(organization_id);
CREATE INDEX idx_contracts_end_date ON contracts(contract_end_date);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX idx_audit_log_organization ON audit_log(organization_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_processing_activities_updated_at BEFORE UPDATE ON processing_activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_toms_updated_at BEFORE UPDATE ON toms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_course_progress_updated_at BEFORE UPDATE ON user_course_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();