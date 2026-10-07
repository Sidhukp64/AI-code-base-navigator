# Student Management System

A full-stack web application for managing students, courses, grades, and attendance.

## Tech Stack
- **Backend**: Python Flask, SQLAlchemy, SQLite
- **Frontend**: React, TypeScript, Tailwind CSS
- **Auth**: JWT tokens

## Features
- Student enrollment and profile management
- Course creation and assignment
- Grade tracking and GPA calculation
- Attendance monitoring
- Role-based access (Admin, Teacher, Student)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Authenticate user |
| GET | /api/auth/me | Get current user |
| GET | /api/students | List all students |
| GET | /api/students/:id | Get student profile |
| POST | /api/students | Create student (admin) |
| GET | /api/courses | List all courses |
| GET | /api/grades/:student_id | Get student grades |
| POST | /api/grades | Add grade (teacher) |

## Installation

```bash
# Backend
pip install flask flask-cors sqlalchemy pyjwt
python backend/main.py

# Frontend
npm install
npm start
```
