"""
Chat Router — AI-powered Q&A about the codebase using RAG.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime, timezone

from services import project_store
from services.ai_service import ask_ai, detect_flow

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    mode: str = "developer"  # "simple" | "developer"
    history: Optional[List[Dict[str, str]]] = None


class ChatResponse(BaseModel):
    answer: str
    citations: list
    flow_diagram: Optional[dict] = None
    mode: str
    timestamp: str


@router.post("/{project_id}")
async def chat(project_id: str, req: ChatRequest):
    """Ask a question about the codebase."""
    project = project_store.get_project(project_id)
    if not project:
        raise HTTPException(404, "Project not found")

    if not req.message.strip():
        raise HTTPException(400, "Message cannot be empty")

    # Retrieve relevant chunks from RAG index
    chunks = project.rag_index.search(req.message, top_k=8)

    # Get AI answer
    answer, citations = ask_ai(
        query=req.message,
        chunks=chunks,
        mode=req.mode,
        history=req.history,
    )

    # Try to build a flow diagram
    flow = None
    flow_data = detect_flow(req.message, chunks)
    if flow_data:
        flow = flow_data

    return ChatResponse(
        answer=answer,
        citations=citations,
        flow_diagram=flow,
        mode=req.mode,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@router.get("/{project_id}/suggestions")
async def get_suggestions(project_id: str):
    """Return suggested questions based on the project's content."""
    project = project_store.get_project(project_id)
    if not project:
        raise HTTPException(404, "Project not found")

    # Build suggestions from detected features
    suggestions = [
        "Explain this project in simple terms",
        "Where is user authentication implemented?",
        "Which file connects to the database?",
        "Where are the API endpoints defined?",
        "How does the login process work?",
        "What is the overall architecture of this project?",
        "Which files handle user registration?",
        "Where is the configuration stored?",
    ]

    # Add language-specific suggestions
    lang_names = [s["language"] for s in project.scan.language_stats[:3]]
    if "Python" in lang_names:
        suggestions.append("Explain the Python backend structure")
    if "JavaScript" in lang_names or "TypeScript" in lang_names:
        suggestions.append("How is the frontend organized?")
    if project.scan.total_api_endpoints > 0:
        suggestions.append("List all API endpoints and their purposes")
    if project.scan.database_file_count > 0:
        suggestions.append("Describe the database schema")

    return {"suggestions": suggestions[:10]}
