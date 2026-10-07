"""
Student Management System - Demo Project
users.py — User management and profile operations
"""
from database import SessionLocal, User, Student, Teacher
from auth import hash_password
import re
import datetime


def validate_email(email: str) -> bool:
    """Validate email format using regex."""
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return re.match(pattern, email) is not None


def validate_password(password: str) -> tuple[bool, str]:
    """
    Validate password strength.
    Returns (is_valid, error_message).
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r"\d", password):
        return False, "Password must contain at least one digit"
    return True, ""


def register_user(username: str, email: str, password: str, role: str = "student") -> dict:
    """
    Register a new user account.
    
    Validates inputs, hashes password, and creates the user record.
    """
    # Validate inputs
    if not username or len(username) < 3:
        raise ValueError("Username must be at least 3 characters")
    
    if not validate_email(email):
        raise ValueError("Invalid email format")
    
    valid, msg = validate_password(password)
    if not valid:
        raise ValueError(msg)
    
    db = SessionLocal()
    try:
        # Check for duplicates
        existing_username = db.query(User).filter_by(username=username).first()
        if existing_username:
            raise ValueError("Username already exists")
        
        existing_email = db.query(User).filter_by(email=email).first()
        if existing_email:
            raise ValueError("Email already registered")
        
        # Create user
        user = User(
            username=username,
            email=email,
            password_hash=hash_password(password),
            role=role,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "created_at": user.created_at.isoformat(),
        }
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def get_user_by_id(user_id: int) -> dict:
    """Retrieve a user by their ID."""
    db = SessionLocal()
    try:
        user = db.query(User).filter_by(id=user_id).first()
        if not user:
            raise ValueError(f"User with ID {user_id} not found")
        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "last_login": user.last_login.isoformat() if user.last_login else None,
        }
    finally:
        db.close()


def update_user_profile(user_id: int, updates: dict) -> dict:
    """Update a user's profile information."""
    allowed_fields = {"email", "phone", "address"}
    db = SessionLocal()
    try:
        user = db.query(User).filter_by(id=user_id).first()
        if not user:
            raise ValueError("User not found")
        
        if "email" in updates and not validate_email(updates["email"]):
            raise ValueError("Invalid email format")
        
        for field, value in updates.items():
            if field in allowed_fields:
                setattr(user, field, value)
        
        db.commit()
        return {"success": True, "message": "Profile updated successfully"}
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def change_password(user_id: int, old_password: str, new_password: str) -> bool:
    """Change a user's password after verifying the old one."""
    from auth import verify_password
    
    db = SessionLocal()
    try:
        user = db.query(User).filter_by(id=user_id).first()
        if not user:
            raise ValueError("User not found")
        
        if not verify_password(old_password, user.password_hash):
            raise ValueError("Current password is incorrect")
        
        valid, msg = validate_password(new_password)
        if not valid:
            raise ValueError(msg)
        
        user.password_hash = hash_password(new_password)
        db.commit()
        return True
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def deactivate_user(user_id: int, admin_id: int) -> bool:
    """Deactivate a user account (admin operation)."""
    db = SessionLocal()
    try:
        admin = db.query(User).filter_by(id=admin_id).first()
        if not admin or admin.role != "admin":
            raise ValueError("Only admins can deactivate accounts")
        
        user = db.query(User).filter_by(id=user_id).first()
        if not user:
            raise ValueError("User not found")
        
        user.is_active = False
        db.commit()
        return True
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def list_users(role: str = None, page: int = 1, per_page: int = 20) -> dict:
    """List users with optional role filter and pagination."""
    db = SessionLocal()
    try:
        query = db.query(User)
        if role:
            query = query.filter_by(role=role)
        
        total = query.count()
        users = query.offset((page - 1) * per_page).limit(per_page).all()
        
        return {
            "users": [
                {
                    "id": u.id,
                    "username": u.username,
                    "email": u.email,
                    "role": u.role,
                    "is_active": u.is_active,
                }
                for u in users
            ],
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": (total + per_page - 1) // per_page,
        }
    finally:
        db.close()
