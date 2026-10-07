"""
Student Management System - Demo Project
auth.py — Authentication and JWT handling
"""
import os
import jwt
import hashlib
import datetime
from functools import wraps
from flask import request, jsonify

SECRET_KEY = os.environ.get("SECRET_KEY", "demo-secret-key-change-in-production")
JWT_EXPIRY_HOURS = 24


def hash_password(password: str) -> str:
    """Hash a password using SHA-256 with a salt."""
    salt = os.urandom(16).hex()
    hashed = hashlib.sha256((password + salt).encode()).hexdigest()
    return f"{salt}:{hashed}"


def verify_password(password: str, stored_hash: str) -> bool:
    """Verify a password against its stored hash."""
    try:
        salt, hashed = stored_hash.split(":", 1)
        return hashlib.sha256((password + salt).encode()).hexdigest() == hashed
    except Exception:
        return False


def generate_jwt_token(user_id: int, username: str, role: str) -> str:
    """Generate a JWT access token for authenticated users."""
    payload = {
        "user_id": user_id,
        "username": username,
        "role": role,
        "iat": datetime.datetime.utcnow(),
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def decode_jwt_token(token: str) -> dict:
    """Decode and validate a JWT token."""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid token")


def login(username: str, password: str, db_session) -> dict:
    """
    Authenticate a user and return a JWT token.
    
    Steps:
    1. Look up user by username in the database.
    2. Verify the password hash.
    3. Generate a JWT token.
    4. Return token and user info.
    """
    from models import User
    user = db_session.query(User).filter_by(username=username).first()
    
    if not user:
        raise ValueError("User not found")
    
    if not verify_password(password, user.password_hash):
        raise ValueError("Invalid credentials")
    
    if not user.is_active:
        raise ValueError("Account is disabled")
    
    # Update last login timestamp
    user.last_login = datetime.datetime.utcnow()
    db_session.commit()
    
    token = generate_jwt_token(user.id, user.username, user.role)
    return {
        "token": token,
        "user_id": user.id,
        "username": user.username,
        "role": user.role,
        "expires_in": JWT_EXPIRY_HOURS * 3600,
    }


def logout(token: str, blacklist) -> bool:
    """Add token to blacklist (server-side logout)."""
    try:
        payload = decode_jwt_token(token)
        blacklist.add(token)
        return True
    except Exception:
        return False


def require_auth(f):
    """Decorator to protect routes that require authentication."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401
        token = auth_header[7:]
        try:
            payload = decode_jwt_token(token)
            request.user = payload
        except ValueError as e:
            return jsonify({"error": str(e)}), 401
        return f(*args, **kwargs)
    return decorated


def require_role(role: str):
    """Decorator to restrict access based on user role."""
    def decorator(f):
        @wraps(f)
        @require_auth
        def decorated(*args, **kwargs):
            if request.user.get("role") != role:
                return jsonify({"error": "Insufficient permissions"}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator
