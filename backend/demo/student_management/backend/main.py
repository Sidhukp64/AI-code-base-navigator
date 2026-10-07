"""
Student Management System - Demo Project
main.py — Flask application entry point and API routes
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from database import init_db, get_db, SessionLocal
from auth import login, require_auth, require_role, hash_password
import datetime

app = Flask(__name__)
CORS(app)

# Initialize database on startup
init_db()


# ── Auth Routes ───────────────────────────────────────────────────────────────

@app.route("/api/auth/login", methods=["POST"])
def api_login():
    """Login endpoint — validates credentials and returns JWT token."""
    data = request.get_json()
    if not data or "username" not in data or "password" not in data:
        return jsonify({"error": "Username and password are required"}), 400
    
    db = SessionLocal()
    try:
        result = login(data["username"], data["password"], db)
        return jsonify({"success": True, "data": result}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 401
    finally:
        db.close()


@app.route("/api/auth/logout", methods=["POST"])
@require_auth
def api_logout():
    """Logout endpoint — invalidates JWT token."""
    return jsonify({"success": True, "message": "Logged out successfully"}), 200


@app.route("/api/auth/me", methods=["GET"])
@require_auth
def api_me():
    """Get current authenticated user's profile."""
    return jsonify({"user": request.user}), 200


# ── Student Routes ────────────────────────────────────────────────────────────

@app.route("/api/students", methods=["GET"])
@require_auth
def get_students():
    """Get all students with optional filters."""
    from database import Student
    db = SessionLocal()
    try:
        query = db.query(Student)
        department = request.args.get("department")
        year = request.args.get("year")
        if department:
            query = query.filter(Student.department == department)
        if year:
            query = query.filter(Student.year_of_study == int(year))
        
        students = query.all()
        return jsonify({
            "students": [
                {
                    "id": s.id,
                    "student_id": s.student_id,
                    "name": f"{s.first_name} {s.last_name}",
                    "department": s.department,
                    "year": s.year_of_study,
                    "gpa": s.gpa,
                }
                for s in students
            ],
            "total": len(students),
        }), 200
    finally:
        db.close()


@app.route("/api/students/<int:student_id>", methods=["GET"])
@require_auth
def get_student(student_id: int):
    """Get a specific student's full profile."""
    from database import Student
    db = SessionLocal()
    try:
        student = db.query(Student).filter_by(id=student_id).first()
        if not student:
            return jsonify({"error": "Student not found"}), 404
        return jsonify({
            "id": student.id,
            "student_id": student.student_id,
            "first_name": student.first_name,
            "last_name": student.last_name,
            "email": student.user.email if student.user else None,
            "department": student.department,
            "year_of_study": student.year_of_study,
            "gpa": student.gpa,
            "phone": student.phone,
        }), 200
    finally:
        db.close()


@app.route("/api/students", methods=["POST"])
@require_role("admin")
def create_student():
    """Create a new student (admin only)."""
    data = request.get_json()
    required = ["username", "email", "password", "first_name", "last_name", "student_id"]
    if not all(k in data for k in required):
        return jsonify({"error": f"Missing required fields: {required}"}), 400
    
    from database import User, Student, SessionLocal
    db = SessionLocal()
    try:
        user = User(
            username=data["username"],
            email=data["email"],
            password_hash=hash_password(data["password"]),
            role="student",
        )
        db.add(user)
        db.flush()
        
        student = Student(
            user_id=user.id,
            student_id=data["student_id"],
            first_name=data["first_name"],
            last_name=data["last_name"],
            department=data.get("department"),
            year_of_study=data.get("year_of_study", 1),
        )
        db.add(student)
        db.commit()
        return jsonify({"success": True, "student_id": student.id}), 201
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


# ── Grades Routes ─────────────────────────────────────────────────────────────

@app.route("/api/grades/<int:student_id>", methods=["GET"])
@require_auth
def get_student_grades(student_id: int):
    """Retrieve all grades for a student."""
    from database import Grade, Course
    db = SessionLocal()
    try:
        grades = db.query(Grade).filter_by(student_id=student_id).all()
        return jsonify({
            "grades": [
                {
                    "course": g.course.name if g.course else "Unknown",
                    "marks": g.marks_obtained,
                    "total": g.total_marks,
                    "grade": g.grade_letter,
                    "semester": g.semester,
                }
                for g in grades
            ]
        }), 200
    finally:
        db.close()


@app.route("/api/grades", methods=["POST"])
@require_role("teacher")
def add_grade():
    """Add a grade for a student in a course."""
    data = request.get_json()
    from database import Grade, SessionLocal
    db = SessionLocal()
    try:
        # Calculate grade letter
        pct = (data["marks_obtained"] / data.get("total_marks", 100)) * 100
        if pct >= 90:
            letter = "A+"
        elif pct >= 80:
            letter = "A"
        elif pct >= 70:
            letter = "B"
        elif pct >= 60:
            letter = "C"
        elif pct >= 50:
            letter = "D"
        else:
            letter = "F"
        
        grade = Grade(
            student_id=data["student_id"],
            course_id=data["course_id"],
            marks_obtained=data["marks_obtained"],
            total_marks=data.get("total_marks", 100),
            grade_letter=letter,
            semester=data.get("semester", "2024-1"),
        )
        db.add(grade)
        db.commit()
        return jsonify({"success": True, "grade": letter}), 201
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


# ── Course Routes ─────────────────────────────────────────────────────────────

@app.route("/api/courses", methods=["GET"])
@require_auth
def get_courses():
    """Get all available courses."""
    from database import Course
    db = SessionLocal()
    try:
        courses = db.query(Course).filter_by(is_active=True).all()
        return jsonify({
            "courses": [
                {
                    "id": c.id,
                    "code": c.course_code,
                    "name": c.name,
                    "credits": c.credits,
                    "department": c.department,
                    "teacher": f"{c.teacher.first_name} {c.teacher.last_name}" if c.teacher else None,
                    "enrolled": len(c.enrollments),
                    "max_students": c.max_students,
                }
                for c in courses
            ]
        }), 200
    finally:
        db.close()


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return jsonify({"status": "ok", "service": "Student Management System"}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
