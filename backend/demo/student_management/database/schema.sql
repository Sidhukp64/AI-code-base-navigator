-- Student Management System Database Schema
-- database.sql — SQL schema for direct DB initialization

-- Users table (authentication)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(200) NOT NULL,
    role VARCHAR(20) DEFAULT 'student',
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE REFERENCES users(id),
    student_id VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth VARCHAR(20),
    department VARCHAR(100),
    year_of_study INTEGER DEFAULT 1,
    gpa REAL DEFAULT 0.0,
    phone VARCHAR(20),
    address TEXT,
    enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Teachers table
CREATE TABLE IF NOT EXISTS teachers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE REFERENCES users(id),
    employee_id VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    department VARCHAR(100),
    specialization VARCHAR(200),
    phone VARCHAR(20)
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    credits INTEGER DEFAULT 3,
    department VARCHAR(100),
    teacher_id INTEGER REFERENCES teachers(id),
    max_students INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT 1
);

-- Enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER REFERENCES students(id),
    course_id INTEGER REFERENCES courses(id),
    enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    UNIQUE(student_id, course_id)
);

-- Grades table
CREATE TABLE IF NOT EXISTS grades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER REFERENCES students(id),
    course_id INTEGER REFERENCES courses(id),
    marks_obtained REAL NOT NULL,
    total_marks REAL DEFAULT 100.0,
    grade_letter VARCHAR(5),
    semester VARCHAR(20),
    graded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER REFERENCES students(id),
    course_id INTEGER REFERENCES courses(id),
    date VARCHAR(20) NOT NULL,
    status VARCHAR(10) DEFAULT 'present',
    notes TEXT
);

-- Seed admin user
INSERT OR IGNORE INTO users (username, email, password_hash, role) VALUES
    ('admin', 'admin@university.edu', 'placeholder_hash', 'admin');

-- Sample courses
INSERT OR IGNORE INTO courses (course_code, name, credits, department) VALUES
    ('CS101', 'Introduction to Programming', 3, 'Computer Science'),
    ('CS201', 'Data Structures & Algorithms', 4, 'Computer Science'),
    ('MATH101', 'Calculus I', 3, 'Mathematics'),
    ('DB301', 'Database Management Systems', 3, 'Computer Science'),
    ('WEB401', 'Web Development', 3, 'Computer Science');
