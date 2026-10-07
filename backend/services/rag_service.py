"""
RAG Service — Retrieval-Augmented Generation for codebase Q&A.
Chunks source files, stores metadata, retrieves relevant chunks per query.
"""
import re
from typing import List, Dict, Optional, Tuple
from services.file_scanner import ScannedFile

CHUNK_SIZE = 60          # lines per chunk
CHUNK_OVERLAP = 10       # overlap between chunks


class CodeChunk:
    def __init__(
        self,
        file_path: str,
        language: str,
        content: str,
        start_line: int,
        end_line: int,
    ):
        self.file_path = file_path
        self.language = language
        self.content = content
        self.start_line = start_line
        self.end_line = end_line

    def to_dict(self) -> dict:
        return {
            "file_path": self.file_path,
            "language": self.language,
            "content": self.content,
            "start_line": self.start_line,
            "end_line": self.end_line,
        }


class RAGIndex:
    """In-memory RAG index for a single project."""

    def __init__(self):
        self.chunks: List[CodeChunk] = []

    def build(self, files: List[ScannedFile]):
        self.chunks = []
        for f in files:
            lines = f.content.splitlines()
            total = len(lines)
            start = 0
            while start < total:
                end = min(start + CHUNK_SIZE, total)
                chunk_lines = lines[start:end]
                self.chunks.append(
                    CodeChunk(
                        file_path=f.relative_path,
                        language=f.language,
                        content="\n".join(chunk_lines),
                        start_line=start + 1,
                        end_line=end,
                    )
                )
                start += CHUNK_SIZE - CHUNK_OVERLAP

    def search(self, query: str, top_k: int = 8) -> List[CodeChunk]:
        """Keyword-based retrieval (works without embeddings)."""
        query_terms = _tokenize(query)
        if not query_terms:
            return self.chunks[:top_k]

        scored: List[Tuple[float, CodeChunk]] = []
        for chunk in self.chunks:
            score = _score_chunk(chunk, query_terms, query)
            if score > 0:
                scored.append((score, chunk))

        scored.sort(key=lambda x: -x[0])
        return [c for _, c in scored[:top_k]]


# ── Scoring helpers ───────────────────────────────────────────────────────────

KEYWORD_MAP: Dict[str, List[str]] = {
    "auth": ["auth", "login", "logout", "jwt", "token", "password", "credential",
             "authenticate", "authorization", "session", "bearer", "oauth"],
    "database": ["database", "db", "sql", "sqlite", "postgres", "mysql", "mongo",
                 "schema", "model", "query", "orm", "sqlalchemy", "connection",
                 "repository", "entity"],
    "api": ["api", "endpoint", "route", "router", "controller", "rest", "http",
            "request", "response", "get", "post", "put", "delete", "patch",
            "fastapi", "express", "flask", "django"],
    "payment": ["payment", "stripe", "paypal", "checkout", "billing", "invoice",
                "transaction", "order", "cart"],
    "email": ["email", "mail", "smtp", "sendgrid", "mailgun", "notification",
              "message", "send"],
    "upload": ["upload", "file", "multipart", "storage", "bucket", "s3", "blob"],
    "user": ["user", "profile", "account", "register", "signup", "member"],
    "config": ["config", "setting", "environment", "env", "variable", "secret"],
}


def _tokenize(text: str) -> List[str]:
    return [w.lower() for w in re.findall(r"\w+", text) if len(w) > 2]


def _score_chunk(chunk: CodeChunk, query_terms: List[str], raw_query: str) -> float:
    content_lower = chunk.content.lower()
    path_lower = chunk.file_path.lower()
    score = 0.0

    for term in query_terms:
        # Exact match in code content
        count = content_lower.count(term)
        score += count * 1.0
        # Path match (higher weight)
        if term in path_lower:
            score += 5.0

    # Semantic keyword expansion
    raw_lower = raw_query.lower()
    for category, keywords in KEYWORD_MAP.items():
        if any(kw in raw_lower for kw in keywords):
            for kw in keywords:
                if kw in content_lower:
                    score += 2.0
                if kw in path_lower:
                    score += 3.0

    return score


def build_context_prompt(chunks: List[CodeChunk], query: str, mode: str) -> str:
    """Build the prompt to send to the LLM."""
    chunks_text = ""
    for i, c in enumerate(chunks, 1):
        chunks_text += (
            f"\n--- Chunk {i}: {c.file_path} (lines {c.start_line}-{c.end_line}) ---\n"
            f"```{c.language.lower()}\n{c.content}\n```\n"
        )

    mode_instruction = (
        "Answer in simple, beginner-friendly language. Avoid jargon. "
        "Explain what the code does in plain English."
        if mode == "simple"
        else "Answer in technical developer language. Be precise about implementation details, "
             "patterns, and architecture."
    )

    return f"""You are an expert code analysis AI. A user is asking a question about their codebase.

MODE: {mode.upper()} — {mode_instruction}

RELEVANT CODE CHUNKS FROM THE CODEBASE:
{chunks_text}

USER QUESTION: {query}

INSTRUCTIONS:
1. Answer the question based ONLY on the provided code chunks.
2. If you cannot find relevant information in the chunks, say exactly: "I could not find this information in the analyzed codebase."
3. Always reference specific file paths and line numbers when citing code.
4. At the end of your answer, list the source files used in this exact format:
   SOURCES:
   - file_path: <path>, lines: <start>-<end>, description: <brief description>
5. If the question is about a code flow or process, describe the flow step by step.
6. Do not invent or guess at code that isn't in the provided chunks.

Answer:"""
