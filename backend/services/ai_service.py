"""
AI Service — wraps OpenAI API calls with fallback demo/mock mode.
"""
import os
import re
import json
from typing import List, Dict, Optional, Tuple
from services.rag_service import CodeChunk, build_context_prompt

try:
    from openai import OpenAI
    _openai_available = True
except ImportError:
    _openai_available = False


def _get_client() -> Optional["OpenAI"]:
    key = os.getenv("OPENAI_API_KEY", "")
    if not _openai_available or not key or key == "your_openai_api_key_here":
        return None
    try:
        return OpenAI(api_key=key)
    except Exception:
        return None


def _parse_sources(text: str) -> Tuple[str, List[Dict]]:
    """Extract SOURCES block from LLM response."""
    citations = []
    pattern = re.compile(
        r"-\s*file_path:\s*(.+?),\s*lines:\s*(\d+)-(\d+),\s*description:\s*(.+)",
        re.IGNORECASE,
    )
    answer_parts = []
    in_sources = False
    for line in text.splitlines():
        if line.strip().upper().startswith("SOURCES:"):
            in_sources = True
            continue
        if in_sources:
            m = pattern.match(line.strip())
            if m:
                citations.append({
                    "file_path": m.group(1).strip(),
                    "start_line": int(m.group(2)),
                    "end_line": int(m.group(3)),
                    "preview": m.group(4).strip(),
                })
        else:
            answer_parts.append(line)

    answer = "\n".join(answer_parts).strip()
    return answer, citations


def ask_ai(
    query: str,
    chunks: List[CodeChunk],
    mode: str = "developer",
    history: Optional[List[Dict]] = None,
) -> Tuple[str, List[Dict]]:
    """
    Query the AI with relevant code chunks.
    Falls back to demo/mock mode if no API key is configured.
    """
    client = _get_client()

    if client is None:
        return _mock_answer(query, chunks, mode)

    prompt = build_context_prompt(chunks, query, mode)
    messages = [{"role": "system", "content": "You are an expert code analysis assistant."}]

    if history:
        for h in history[-4:]:  # last 4 exchanges
            messages.append(h)

    messages.append({"role": "user", "content": prompt})

    try:
        model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=1500,
            temperature=0.2,
        )
        raw = response.choices[0].message.content or ""
        answer, citations = _parse_sources(raw)
        # Fallback: if no citations parsed but we have chunks, use top chunks
        if not citations and chunks:
            citations = [
                {
                    "file_path": c.file_path,
                    "start_line": c.start_line,
                    "end_line": c.end_line,
                    "preview": f"Relevant code in {c.file_path}",
                }
                for c in chunks[:3]
            ]
        return answer, citations
    except Exception as e:
        return _mock_answer(query, chunks, mode)


def generate_summary(
    project_name: str,
    language_stats: List[Dict],
    total_files: int,
    api_endpoints: int,
    functions: int,
) -> str:
    """Generate a project summary — AI or mock."""
    client = _get_client()
    langs = ", ".join(f"{s['language']} ({s['file_count']} files)" for s in language_stats[:5])

    if client is None:
        return _mock_summary(project_name, language_stats, total_files, api_endpoints)

    prompt = (
        f"Generate a concise 2-3 sentence technical summary of a software project named '{project_name}' "
        f"with the following stats: {total_files} files, {api_endpoints} API endpoints, "
        f"{functions} functions. Languages used: {langs}. "
        f"Mention the likely purpose and tech stack based on the languages. Be specific."
    )
    try:
        model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
            temperature=0.4,
        )
        return response.choices[0].message.content or _mock_summary(
            project_name, language_stats, total_files, api_endpoints
        )
    except Exception:
        return _mock_summary(project_name, language_stats, total_files, api_endpoints)


def detect_flow(query: str, chunks: List[CodeChunk]) -> Optional[List[Dict]]:
    """Detect a code flow diagram if the question is about a process/flow."""
    flow_triggers = ["flow", "process", "explain how", "how does", "walk me through",
                     "step by step", "sequence", "pipeline"]
    if not any(t in query.lower() for t in flow_triggers):
        return None

    # Build a simple flow from discovered files in chunks
    seen_files = []
    for c in chunks:
        if c.file_path not in seen_files:
            seen_files.append(c.file_path)

    if len(seen_files) < 2:
        return None

    nodes = []
    for i, fp in enumerate(seen_files[:6]):
        nodes.append({
            "id": str(i),
            "label": fp.split("/")[-1],
            "path": fp,
            "type": "file",
        })

    edges = [{"from": str(i), "to": str(i + 1)} for i in range(len(nodes) - 1)]
    return {"nodes": nodes, "edges": edges}


# ── Mock / Demo mode ──────────────────────────────────────────────────────────

_MOCK_ANSWERS = {
    "auth": (
        "User authentication is handled by the authentication module. "
        "The login function validates credentials against the database and generates a JWT token upon success. "
        "The token is then returned to the client for subsequent authenticated requests.",
        [
            {"file_path": "backend/auth.py", "start_line": 15, "end_line": 48,
             "preview": "Authentication and JWT generation"},
            {"file_path": "backend/users.py", "start_line": 20, "end_line": 35,
             "preview": "User model and lookup"},
        ],
    ),
    "database": (
        "The database connection is configured in the database module. "
        "It uses SQLAlchemy as the ORM layer with a connection pool. "
        "Models are defined using declarative base classes.",
        [
            {"file_path": "backend/database.py", "start_line": 1, "end_line": 40,
             "preview": "Database connection and session management"},
        ],
    ),
    "api": (
        "API endpoints are defined using FastAPI route decorators. "
        "The routes are organized in separate router modules for each feature area. "
        "All endpoints follow RESTful conventions.",
        [
            {"file_path": "backend/main.py", "start_line": 1, "end_line": 30,
             "preview": "API application entry point"},
            {"file_path": "backend/routes.py", "start_line": 10, "end_line": 80,
             "preview": "Route definitions"},
        ],
    ),
}

_SIMPLE_MOCK_ANSWERS = {
    "auth": (
        "The 'auth' file checks if your username and password are correct. "
        "If they match, it creates a special login key called a 'JWT token' that lets you access protected pages. "
        "Think of it like a digital ID badge.",
        _MOCK_ANSWERS["auth"][1],
    ),
    "database": (
        "The database file is like the filing cabinet of the application. "
        "It connects the app to where all the data is stored and lets you read, add, update, and delete records.",
        _MOCK_ANSWERS["database"][1],
    ),
}


def _mock_answer(query: str, chunks: List[CodeChunk], mode: str) -> Tuple[str, List[Dict]]:
    """Return a realistic mock answer when no API key is available."""
    q_lower = query.lower()

    # Try to match query to chunks
    if chunks:
        # Build answer from actual chunk content
        top = chunks[0]
        second = chunks[1] if len(chunks) > 1 else None

        if mode == "simple":
            answer = (
                f"Looking at the codebase, the file **{top.file_path}** seems to handle what you're asking about. "
                f"It contains code that {_describe_file_simple(top.file_path)}. "
            )
            if second:
                answer += f"The file **{second.file_path}** also plays a role by {_describe_file_simple(second.file_path)}."
        else:
            answer = (
                f"Based on the codebase analysis, **{top.file_path}** (lines {top.start_line}–{top.end_line}) "
                f"is the primary location for this functionality. "
            )
            if second:
                answer += (
                    f"**{second.file_path}** (lines {second.start_line}–{second.end_line}) "
                    f"provides supporting implementation."
                )

        # Check for "not found"
        if not chunks:
            return "I could not find this information in the analyzed codebase.", []

        citations = [
            {
                "file_path": c.file_path,
                "start_line": c.start_line,
                "end_line": c.end_line,
                "preview": f"Relevant code in {c.file_path.split('/')[-1]}",
            }
            for c in chunks[:3]
        ]
        return answer, citations

    # Fallback keyword answers
    for key, (ans_dev, cites) in _MOCK_ANSWERS.items():
        if key in q_lower:
            if mode == "simple" and key in _SIMPLE_MOCK_ANSWERS:
                return _SIMPLE_MOCK_ANSWERS[key]
            return ans_dev, cites

    return (
        "I could not find specific information about this in the analyzed codebase. "
        "Try rephrasing your question or searching for specific keywords.",
        [],
    )


def _describe_file_simple(path: str) -> str:
    name = path.lower().split("/")[-1]
    if "auth" in name:
        return "handles login and checks passwords"
    if "user" in name:
        return "manages user accounts and profiles"
    if "db" in name or "database" in name:
        return "connects to and manages the database"
    if "route" in name or "api" in name:
        return "defines the web API endpoints"
    if "model" in name:
        return "defines data structures"
    if "config" in name or "setting" in name:
        return "stores application settings"
    if "main" in name or "app" in name or "index" in name:
        return "starts up the application"
    return "handles an important part of the application"


def _mock_summary(
    project_name: str, language_stats: List[Dict], total_files: int, api_endpoints: int
) -> str:
    if not language_stats:
        return f"This is the {project_name} project containing {total_files} source files."

    primary = language_stats[0]["language"] if language_stats else "Python"
    secondary = language_stats[1]["language"] if len(language_stats) > 1 else ""

    stack_desc = {
        "Python": "Python-based backend",
        "JavaScript": "JavaScript application",
        "TypeScript": "TypeScript application",
        "Java": "Java application",
    }.get(primary, f"{primary} application")

    summary = f"This is a {stack_desc}"
    if secondary:
        summary += f" with {secondary} components"
    summary += f". The project contains {total_files} source files"
    if api_endpoints > 0:
        summary += f" and exposes {api_endpoints} API endpoints"
    summary += ". "

    if "React" in [s["language"] for s in language_stats] or secondary in ("JavaScript", "TypeScript"):
        summary += "The architecture follows a client-server pattern with a modern frontend and a structured backend. "

    summary += "Use the AI Assistant to ask questions about specific features or the overall architecture."
    return summary
