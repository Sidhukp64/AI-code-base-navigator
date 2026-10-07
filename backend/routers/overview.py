"""
Overview Router — project overview, modules, and AI summary.
"""
from fastapi import APIRouter, HTTPException
from services import project_store

router = APIRouter()

MODULE_PATTERNS = {
    "Authentication": {
        "keywords": ["auth", "login", "jwt", "token", "password", "session"],
        "icon": "🔐",
    },
    "Database": {
        "keywords": ["database", "db", "model", "schema", "migration", "orm", "sql"],
        "icon": "🗄️",
    },
    "API": {
        "keywords": ["route", "router", "endpoint", "controller", "api", "rest"],
        "icon": "🌐",
    },
    "User Management": {
        "keywords": ["user", "profile", "account", "register", "member"],
        "icon": "👤",
    },
    "Frontend": {
        "keywords": [".jsx", ".tsx", ".vue", ".svelte", "component", "page"],
        "icon": "🎨",
    },
    "Configuration": {
        "keywords": ["config", "settings", "environment", ".env", "constants"],
        "icon": "⚙️",
    },
    "Email / Notifications": {
        "keywords": ["email", "mail", "smtp", "notification", "sendgrid"],
        "icon": "📧",
    },
    "Payment": {
        "keywords": ["payment", "stripe", "paypal", "billing", "checkout"],
        "icon": "💳",
    },
    "File Storage": {
        "keywords": ["upload", "storage", "s3", "blob", "file", "media"],
        "icon": "📁",
    },
    "Testing": {
        "keywords": ["test", "spec", "jest", "pytest", "unittest", "fixture"],
        "icon": "🧪",
    },
}


@router.get("/{project_id}")
async def get_overview(project_id: str):
    """Return full project overview with modules and AI summary."""
    project = project_store.get_project(project_id)
    if not project:
        raise HTTPException(404, "Project not found")

    # Detect modules
    modules = _detect_modules(project)

    return {
        "project": project.to_summary_dict(),
        "modules": modules,
        "ai_summary": project.ai_summary,
    }


def _detect_modules(project) -> list:
    """Detect high-level modules in the project based on file paths and content."""
    detected = []

    for module_name, info in MODULE_PATTERNS.items():
        matched_files = []
        for f in project.scan.files:
            path_lower = f.relative_path.lower()
            content_lower = f.content.lower()
            # Check keywords in path or content
            for kw in info["keywords"]:
                if kw in path_lower or (kw in content_lower and len(kw) > 3):
                    matched_files.append(f.relative_path)
                    break

        if matched_files:
            # Deduplicate and take top 5 most relevant
            unique = list(dict.fromkeys(matched_files))[:5]
            detected.append({
                "name": module_name,
                "icon": info["icon"],
                "files": unique,
                "file_count": len(unique),
                "description": _module_description(module_name, unique),
            })

    return detected[:8]  # Max 8 modules


def _module_description(name: str, files: list) -> str:
    """Generate a short description for a detected module."""
    file_names = [f.split("/")[-1] for f in files[:2]]
    names_str = ", ".join(file_names)
    descriptions = {
        "Authentication": f"Handles user login/logout and token management ({names_str})",
        "Database": f"Manages data persistence and ORM models ({names_str})",
        "API": f"Defines REST API routes and controllers ({names_str})",
        "User Management": f"Manages user accounts and profiles ({names_str})",
        "Frontend": f"Contains UI components and pages ({names_str})",
        "Configuration": f"Stores app settings and environment config ({names_str})",
        "Email / Notifications": f"Handles email sending and notifications ({names_str})",
        "Payment": f"Processes payments and billing ({names_str})",
        "File Storage": f"Manages file uploads and storage ({names_str})",
        "Testing": f"Contains test suites and fixtures ({names_str})",
    }
    return descriptions.get(name, f"Module containing {names_str}")
