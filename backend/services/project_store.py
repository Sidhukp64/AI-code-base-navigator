"""
Project Store — in-memory store for loaded projects and their RAG indexes.
"""
import os
import uuid
import shutil
import tempfile
from datetime import datetime, timezone
from typing import Dict, Optional
from services.file_scanner import ScanResult, scan_directory, build_file_tree
from services.rag_service import RAGIndex
from services.ai_service import generate_summary

# Base temp dir for extracted projects
PROJECTS_DIR = os.path.join(tempfile.gettempdir(), "codenavigator_projects")
os.makedirs(PROJECTS_DIR, exist_ok=True)


class Project:
    def __init__(self, project_id: str, name: str, source: str,
                 scan: ScanResult, root_dir: str, github_url: Optional[str] = None):
        self.id = project_id
        self.name = name
        self.source = source
        self.github_url = github_url
        self.scan = scan
        self.root_dir = root_dir
        self.created_at = datetime.now(timezone.utc).isoformat()
        self.last_analyzed = self.created_at
        self.file_tree = build_file_tree(root_dir, scan.files)
        self.rag_index = RAGIndex()
        self.rag_index.build(scan.files)
        self.ai_summary = generate_summary(
            name,
            scan.language_stats,
            scan.total_files,
            scan.total_api_endpoints,
            scan.total_functions,
        )

    def get_file_content(self, file_path: str) -> Optional[dict]:
        norm = file_path.replace("\\", "/").lstrip("/")
        for f in self.scan.files:
            if f.relative_path == norm or f.relative_path.endswith("/" + norm):
                return {
                    "path": f.relative_path,
                    "language": f.language,
                    "content": f.content,
                    "lines": f.lines,
                    "size": f.size,
                }
        return None

    def to_summary_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "source": self.source,
            "github_url": self.github_url,
            "created_at": self.created_at,
            "last_analyzed": self.last_analyzed,
            "ai_summary": self.ai_summary,
            "stats": {
                "total_files": self.scan.total_files,
                "total_lines": self.scan.total_lines,
                "functions": self.scan.total_functions,
                "classes": self.scan.total_classes,
                "api_endpoints": self.scan.total_api_endpoints,
                "database_files": self.scan.database_file_count,
                "config_files": self.scan.config_file_count,
                "languages": self.scan.language_stats,
            },
            "file_tree": self.file_tree,
            "chunks_indexed": len(self.rag_index.chunks),
        }


# ── Global in-memory store ────────────────────────────────────────────────────
_store: Dict[str, Project] = {}


def create_project(name: str, source: str, root_dir: str,
                   github_url: Optional[str] = None) -> Project:
    project_id = str(uuid.uuid4())
    scan = scan_directory(root_dir)
    project = Project(project_id, name, source, scan, root_dir, github_url)
    _store[project_id] = project
    return project


def get_project(project_id: str) -> Optional[Project]:
    return _store.get(project_id)


def list_projects() -> list:
    return [p.to_summary_dict() for p in _store.values()]


def delete_project(project_id: str) -> bool:
    project = _store.pop(project_id, None)
    if project and project.source != "demo":
        try:
            shutil.rmtree(project.root_dir, ignore_errors=True)
        except Exception:
            pass
    return project is not None
