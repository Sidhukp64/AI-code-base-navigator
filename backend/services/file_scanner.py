"""
File Scanner Service
Scans uploaded/imported repositories, extracts structure, detects languages.
"""
import os
import re
import zipfile
import shutil
import tempfile
import chardet
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# ── Constants ─────────────────────────────────────────────────────────────────

IGNORED_DIRS = {
    "node_modules", ".git", "__pycache__", "dist", "build",
    ".venv", "venv", "env", ".env", "vendor", "bower_components",
    ".next", ".nuxt", "coverage", ".pytest_cache", ".mypy_cache",
    ".idea", ".vscode", "__MACOSX", ".DS_Store", "target", "out",
    "bin", "obj", ".gradle", ".cache",
}

IGNORED_FILES = {
    ".gitignore", ".gitattributes", "package-lock.json", "yarn.lock",
    "pnpm-lock.yaml", "poetry.lock", "Pipfile.lock", ".DS_Store",
    "Thumbs.db",
}

SUPPORTED_EXTENSIONS: Dict[str, str] = {
    ".py": "Python",
    ".js": "JavaScript",
    ".jsx": "JavaScript",
    ".ts": "TypeScript",
    ".tsx": "TypeScript",
    ".java": "Java",
    ".c": "C",
    ".h": "C",
    ".cpp": "C++",
    ".cc": "C++",
    ".cxx": "C++",
    ".cs": "C#",
    ".html": "HTML",
    ".htm": "HTML",
    ".css": "CSS",
    ".scss": "CSS",
    ".sass": "CSS",
    ".sql": "SQL",
    ".json": "JSON",
    ".md": "Markdown",
    ".yaml": "YAML",
    ".yml": "YAML",
    ".xml": "XML",
    ".sh": "Shell",
    ".bash": "Shell",
    ".env": "Config",
    ".toml": "Config",
    ".ini": "Config",
    ".cfg": "Config",
    ".conf": "Config",
    ".txt": "Text",
    ".rs": "Rust",
    ".go": "Go",
    ".rb": "Ruby",
    ".php": "PHP",
    ".swift": "Swift",
    ".kt": "Kotlin",
    ".r": "R",
    ".vue": "Vue",
    ".svelte": "Svelte",
    ".graphql": "GraphQL",
    ".proto": "Protobuf",
    ".dart": "Dart",
    ".lua": "Lua",
    ".ex": "Elixir",
    ".exs": "Elixir",
    ".erl": "Erlang",
    ".tf": "Terraform",
    ".dockerfile": "Docker",
}

MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024  # 2 MB per file


# ── Helpers ───────────────────────────────────────────────────────────────────

def is_binary_file(filepath: str) -> bool:
    """Quick heuristic to detect binary files."""
    try:
        with open(filepath, "rb") as f:
            chunk = f.read(8192)
        if b"\x00" in chunk:
            return True
        # Detect encoding
        result = chardet.detect(chunk)
        if result["encoding"] is None:
            return True
        return False
    except Exception:
        return True


def get_language(filepath: str) -> Optional[str]:
    path = Path(filepath)
    ext = path.suffix.lower()
    if ext in SUPPORTED_EXTENSIONS:
        return SUPPORTED_EXTENSIONS[ext]
    name = path.name.lower()
    if name == "dockerfile":
        return "Docker"
    if name == "makefile":
        return "Makefile"
    return None


def count_functions_and_classes(content: str, language: str) -> Tuple[int, int]:
    """Simple regex-based function/class counter."""
    functions = 0
    classes = 0
    if language in ("Python",):
        functions = len(re.findall(r"^\s*def\s+\w+", content, re.MULTILINE))
        classes = len(re.findall(r"^\s*class\s+\w+", content, re.MULTILINE))
    elif language in ("JavaScript", "TypeScript"):
        functions = len(re.findall(
            r"(function\s+\w+|=>\s*\{|async\s+function|\w+\s*=\s*function|\w+\s*:\s*function)",
            content,
        ))
        classes = len(re.findall(r"\bclass\s+\w+", content))
    elif language == "Java":
        functions = len(re.findall(r"(public|private|protected|static).*\w+\s*\(", content))
        classes = len(re.findall(r"\bclass\s+\w+", content))
    elif language == "C++":
        functions = len(re.findall(r"\w[\w\s\*&<>]*\s+\w+\s*\(", content))
        classes = len(re.findall(r"\bclass\s+\w+", content))
    elif language == "C#":
        functions = len(re.findall(r"(public|private|protected|internal|static).*\w+\s*\(", content))
        classes = len(re.findall(r"\bclass\s+\w+", content))
    return functions, classes


def count_api_endpoints(content: str, language: str) -> int:
    """Count REST API endpoint decorators/annotations."""
    count = 0
    patterns = [
        r'@app\.(get|post|put|delete|patch)\s*\(',     # FastAPI/Flask
        r'@router\.(get|post|put|delete|patch)\s*\(',  # FastAPI router
        r'@(Get|Post|Put|Delete|Patch)\(',              # NestJS/Spring
        r'@RequestMapping',                             # Spring
        r'router\.(get|post|put|delete|patch)\s*\(',   # Express.js
        r'app\.(get|post|put|delete|patch)\s*\(',      # Express.js direct
    ]
    for pattern in patterns:
        count += len(re.findall(pattern, content, re.IGNORECASE))
    return count


def is_database_file(filepath: str, content: str) -> bool:
    db_keywords = ["CREATE TABLE", "SELECT", "INSERT INTO", "sqlalchemy",
                   "mongoose", "prisma", "knex", "sequelize", "database"]
    ext = Path(filepath).suffix.lower()
    if ext == ".sql":
        return True
    lower = content.lower()
    return any(kw.lower() in lower for kw in db_keywords[:5])


def is_config_file(filepath: str) -> bool:
    name = Path(filepath).name.lower()
    ext = Path(filepath).suffix.lower()
    return ext in (".json", ".yaml", ".yml", ".toml", ".ini", ".cfg", ".conf", ".env") or \
           name in ("config.py", "settings.py", "configuration.js", "config.ts")


# ── Core Scanner ──────────────────────────────────────────────────────────────

class ScannedFile:
    def __init__(self, path: str, relative_path: str, language: str,
                 content: str, size: int):
        self.path = path
        self.relative_path = relative_path
        self.language = language
        self.content = content
        self.size = size
        self.lines = content.count("\n") + 1
        funcs, cls = count_functions_and_classes(content, language)
        self.functions = funcs
        self.classes = cls
        self.api_endpoints = count_api_endpoints(content, language)
        self.is_db_file = is_database_file(relative_path, content)
        self.is_config = is_config_file(relative_path)


class ScanResult:
    def __init__(self, files: List[ScannedFile], root_dir: str):
        self.files = files
        self.root_dir = root_dir

    @property
    def total_files(self) -> int:
        return len(self.files)

    @property
    def total_lines(self) -> int:
        return sum(f.lines for f in self.files)

    @property
    def total_functions(self) -> int:
        return sum(f.functions for f in self.files)

    @property
    def total_classes(self) -> int:
        return sum(f.classes for f in self.files)

    @property
    def total_api_endpoints(self) -> int:
        return sum(f.api_endpoints for f in self.files)

    @property
    def database_file_count(self) -> int:
        return sum(1 for f in self.files if f.is_db_file)

    @property
    def config_file_count(self) -> int:
        return sum(1 for f in self.files if f.is_config)

    @property
    def language_stats(self) -> List[Dict]:
        counts: Dict[str, int] = {}
        for f in self.files:
            counts[f.language] = counts.get(f.language, 0) + 1
        total = len(self.files) or 1
        stats = [
            {
                "language": lang,
                "file_count": cnt,
                "percentage": round(cnt / total * 100, 1),
            }
            for lang, cnt in sorted(counts.items(), key=lambda x: -x[1])
        ]
        return stats


def scan_directory(root_dir: str) -> ScanResult:
    """Walk a directory and return a ScanResult with all supported files."""
    scanned: List[ScannedFile] = []
    root = Path(root_dir)

    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Prune ignored dirs in-place
        dirnames[:] = [
            d for d in dirnames
            if d not in IGNORED_DIRS and not d.startswith(".")
        ]

        for filename in filenames:
            if filename in IGNORED_FILES:
                continue

            full_path = os.path.join(dirpath, filename)
            rel_path = os.path.relpath(full_path, root_dir).replace("\\", "/")
            lang = get_language(full_path)
            if lang is None:
                continue

            try:
                size = os.path.getsize(full_path)
                if size > MAX_FILE_SIZE_BYTES:
                    continue
                if size == 0:
                    continue
                if is_binary_file(full_path):
                    continue
                with open(full_path, "r", encoding="utf-8", errors="replace") as fh:
                    content = fh.read()
                scanned.append(ScannedFile(full_path, rel_path, lang, content, size))
            except Exception:
                continue

    return ScanResult(scanned, root_dir)


def extract_zip(zip_path: str, extract_to: str) -> str:
    """
    Safely extract a ZIP archive.
    Returns the root directory of the extracted content.
    Raises ValueError on path-traversal attempts.
    """
    abs_extract = os.path.abspath(extract_to)

    with zipfile.ZipFile(zip_path, "r") as zf:
        # Security: check for path traversal
        for member in zf.namelist():
            member_path = os.path.abspath(os.path.join(abs_extract, member))
            if not member_path.startswith(abs_extract + os.sep) and \
               member_path != abs_extract:
                raise ValueError(f"Path traversal detected in ZIP: {member}")
        zf.extractall(abs_extract)

    # If everything is inside a single top-level folder, return that folder
    entries = os.listdir(abs_extract)
    if len(entries) == 1:
        candidate = os.path.join(abs_extract, entries[0])
        if os.path.isdir(candidate):
            return candidate
    return abs_extract


def build_file_tree(root_dir: str, files: List[ScannedFile]) -> dict:
    """Build a nested tree structure from scanned files."""
    tree: dict = {"name": Path(root_dir).name, "path": "", "type": "directory", "children": []}

    def insert(node: dict, parts: List[str], file: ScannedFile, depth: int):
        if depth == len(parts) - 1:
            node["children"].append({
                "name": parts[depth],
                "path": file.relative_path,
                "type": "file",
                "language": file.language,
                "size": file.size,
            })
            return
        # Find or create child dir
        folder_name = parts[depth]
        for child in node["children"]:
            if child["type"] == "directory" and child["name"] == folder_name:
                insert(child, parts, file, depth + 1)
                return
        new_dir = {
            "name": folder_name,
            "path": "/".join(parts[: depth + 1]),
            "type": "directory",
            "children": [],
        }
        node["children"].append(new_dir)
        insert(new_dir, parts, file, depth + 1)

    for f in sorted(files, key=lambda x: x.relative_path):
        parts = f.relative_path.split("/")
        insert(tree, parts, f, 0)

    return tree
