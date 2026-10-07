"""
AI Codebase Navigator - Backend Entry Point
FastAPI application for analyzing and querying codebases with AI.
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers import projects, chat, search, github, overview

load_dotenv()

app = FastAPI(
    title="AI Codebase Navigator API",
    description="Backend API for analyzing codebases and answering questions with AI",
    version="1.0.0",
)

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(search.router, prefix="/api/search", tags=["search"])
app.include_router(github.router, prefix="/api/github", tags=["github"])
app.include_router(overview.router, prefix="/api/overview", tags=["overview"])


@app.get("/")
async def root():
    return {"message": "AI Codebase Navigator API is running", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
