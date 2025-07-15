-- Create database
CREATE DATABASE IF NOT EXISTS applyai;
USE applyai;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert a default admin user (password: admin123)
INSERT INTO users (email, password, is_approved, is_admin) VALUES 
('admin@applyai.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', TRUE, TRUE)
ON DUPLICATE KEY UPDATE 
    password = VALUES(password),
    is_approved = VALUES(is_approved),
    is_admin = VALUES(is_admin);