"""
Search Router — full-text code search within a project.
"""
import re
from fastapi import APIRouter, HTTPException, Query
from typing import List

from services import project_store

router = APIRouter()

CONTEXT_LINES = 2  # Lines of context around a match


@router.get("/{project_id}")
async def search_code(
    project_id: str,
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(50, le=200),
):
    """Search for a keyword across all files in the project."""
    project = project_store.get_project(project_id)
    if not project:
        raise HTTPException(404, "Project not found")

    query_lower = q.lower()
    results = []

    for f in project.scan.files:
        lines = f.content.splitlines()
        for i, line in enumerate(lines):
            if query_lower in line.lower():
                # Gather context
                start = max(0, i - CONTEXT_LINES)
                end = min(len(lines), i + CONTEXT_LINES + 1)
                context_block = "\n".join(
                    f"{j + 1}: {lines[j]}" for j in range(start, end)
                )
                results.append({
                    "file_path": f.relative_path,
                    "line_number": i + 1,
                    "line_content": line.rstrip(),
                    "context": context_block,
                    "language": f.language,
                    "explanation": _explain_match(line, q, f.relative_path),
                })
                if len(results) >= limit:
                    break
        if len(results) >= limit:
            break

    # Sort by relevance (exact match first)
    results.sort(key=lambda r: (
        0 if q.lower() in r["line_content"].lower() else 1,
        r["file_path"],
        r["line_number"],
    ))

    return {"query": q, "results": results, "total": len(results)}


@router.get("/{project_id}/find/{category}")
async def find_category(project_id: str, category: str):
    """
    Find files/code related to a specific category.
    Categories: auth, database, api, payment, email, upload, config
    """
    project = project_store.get_project(project_id)
    if not project:
        raise HTTPException(404, "Project not found")

    CATEGORY_PATTERNS = {
        "auth": {
            "keywords": ["login", "logout", "authenticate", "jwt", "token", "password", "auth"],
            "file_patterns": ["auth", "login", "session", "credential"],
            "description": "Authentication & Authorization",
        },
        "database": {
            "keywords": ["database", "db", "sql", "query", "SELECT", "INSERT", "sqlalchemy", "mongoose"],
            "file_patterns": ["database", "db", "model", "schema", "migration"],
            "description": "Database & Data Layer",
        },
        "api": {
            "keywords": ["@app.get", "@app.post", "router.get", "router.post", "app.get(", "app.post("],
            "file_patterns": ["route", "api", "endpoint", "controller"],
            "description": "API Endpoints & Routes",
        },
        "payment": {
            "keywords": ["stripe", "paypal", "payment", "checkout", "billing", "invoice", "transaction"],
            "file_patterns": ["payment", "billing", "checkout", "stripe"],
            "description": "Payment Processing",
        },
        "email": {
            "keywords": ["email", "smtp", "sendgrid", "mailgun", "send_mail", "mail"],
            "file_patterns": ["email", "mail", "notification", "smtp"],
            "description": "Email Services",
        },
        "upload": {
            "keywords": ["upload", "multipart", "file", "UploadFile", "multer", "storage", "s3"],
            "file_patterns": ["upload", "storage", "file", "media"],
            "description": "File Upload & Storage",
        },
        "config": {
            "keywords": ["config", "settings", "environment", "env", "SECRET", "DATABASE_URL"],
            "file_patterns": ["config", "settings", ".env", "configuration"],
            "description": "Configuration & Settings",
        },
    }

    cat = category.lower()
    if cat not in CATEGORY_PATTERNS:
        raise HTTPException(400, f"Unknown category: {category}. Available: {list(CATEGORY_PATTERNS.keys())}")

    pattern_info = CATEGORY_PATTERNS[cat]
    results = []

    for f in project.scan.files:
        score = 0
        matched_lines = []
        lines = f.content.splitlines()

        # Score by filename
        fname = f.relative_path.lower()
        for fp in pattern_info["file_patterns"]:
            if fp in fname:
                score += 10
                break

        # Score by content
        for i, line in enumerate(lines):
            line_lower = line.lower()
            for kw in pattern_info["keywords"]:
                if kw.lower() in line_lower:
                    score += 2
                    matched_lines.append(i + 1)

        if score > 0 and matched_lines:
            start_line = matched_lines[0]
            end_line = min(matched_lines[-1] + 5, len(lines))
            preview_lines = lines[start_line - 1: start_line + 4]
            results.append({
                "file_path": f.relative_path,
                "start_line": start_line,
                "end_line": end_line,
                "description": f"{pattern_info['description']} in {f.relative_path.split('/')[-1]}",
                "relevance": min(score / 30, 1.0),
                "preview": "\n".join(preview_lines),
            })

    results.sort(key=lambda r: -r["relevance"])
    return {
        "category": category,
        "description": pattern_info.get("description", category),
        "results": results[:10],
    }


def _explain_match(line: str, query: str, filepath: str) -> str:
    """Generate a brief explanation of why this line matches."""
    name = filepath.split("/")[-1]
    line_stripped = line.strip()
    if "def " in line_stripped or "function " in line_stripped or "const " in line_stripped:
        return f"Function definition in {name}"
    if "class " in line_stripped:
        return f"Class definition in {name}"
    if "import " in line_stripped or "from " in line_stripped:
        return f"Import statement in {name}"
    if "=" in line_stripped and "==" not in line_stripped:
        return f"Variable assignment in {name}"
    return f"Occurrence in {name}"
