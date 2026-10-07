"""
Pydantic models / schemas for the AI Codebase Navigator API.
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime


# ── Project ──────────────────────────────────────────────────────────────────

class FileNode(BaseModel):
    name: str
    path: str
    type: str  # "file" | "directory"
    language: Optional[str] = None
    size: Optional[int] = None
    children: Optional[List["FileNode"]] = None

FileNode.model_rebuild()


class LanguageStat(BaseModel):
    language: str
    file_count: int
    percentage: float


class ProjectStats(BaseModel):
    total_files: int
    total_lines: int
    languages: List[LanguageStat]
    functions: int
    classes: int
    api_endpoints: int
    database_files: int
    config_files: int


class ProjectSummary(BaseModel):
    id: str
    name: str
    created_at: str
    last_analyzed: str
    stats: ProjectStats
    ai_summary: Optional[str] = None
    source: str  # "upload" | "github" | "demo"
    github_url: Optional[str] = None


class ProjectDetail(ProjectSummary):
    file_tree: FileNode
    chunks_indexed: int


# ── File Content ─────────────────────────────────────────────────────────────

class FileContent(BaseModel):
    path: str
    language: str
    content: str
    lines: int
    size: int


# ── Chat ─────────────────────────────────────────────────────────────────────

class Citation(BaseModel):
    file_path: str
    start_line: int
    end_line: int
    preview: str


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str
    citations: Optional[List[Citation]] = None
    flow_diagram: Optional[List[Dict[str, Any]]] = None
    timestamp: Optional[str] = None


class ChatRequest(BaseModel):
    project_id: str
    message: str
    mode: str = "developer"  # "simple" | "developer"
    history: Optional[List[Dict[str, str]]] = None


class ChatResponse(BaseModel):
    answer: str
    citations: List[Citation]
    flow_diagram: Optional[List[Dict[str, Any]]] = None
    mode: str


# ── Search ────────────────────────────────────────────────────────────────────

class SearchResult(BaseModel):
    file_path: str
    line_number: int
    line_content: str
    context: str
    language: str
    explanation: Optional[str] = None


class SearchRequest(BaseModel):
    project_id: str
    query: str


class SearchResponse(BaseModel):
    query: str
    results: List[SearchResult]
    total: int


# ── Find Where ───────────────────────────────────────────────────────────────

class FindResult(BaseModel):
    file_path: str
    start_line: int
    end_line: int
    description: str
    relevance: float


class FindResponse(BaseModel):
    category: str
    results: List[FindResult]


# ── GitHub ───────────────────────────────────────────────────────────────────

class GitHubImportRequest(BaseModel):
    url: str


# ── Overview ─────────────────────────────────────────────────────────────────

class ModuleInfo(BaseModel):
    name: str
    files: List[str]
    description: str


class OverviewResponse(BaseModel):
    project: ProjectDetail
    modules: List[ModuleInfo]
    ai_summary: str
