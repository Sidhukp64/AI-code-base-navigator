"""
GitHub Router — import public GitHub repositories.
"""
import os
import re
import shutil
import tempfile
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services import project_store

router = APIRouter()

GITHUB_API = "https://api.github.com"
MAX_REPO_FILES = 300


class GitHubImportRequest(BaseModel):
    url: str


def parse_github_url(url: str):
    """Parse a GitHub URL into (owner, repo) tuple."""
    patterns = [
        r"github\.com[/:]([^/]+)/([^/\s\.]+?)(?:\.git)?$",
        r"github\.com[/:]([^/]+)/([^/\s]+)",
    ]
    for p in patterns:
        m = re.search(p, url.strip())
        if m:
            return m.group(1), m.group(2).rstrip("/")
    return None, None


async def fetch_repo_tree(owner: str, repo: str, token: str = None) -> list:
    """Fetch the full file tree of a GitHub repo using the Trees API."""
    headers = {"Accept": "application/vnd.github+json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    async with httpx.AsyncClient(timeout=30) as client:
        # Get default branch
        repo_res = await client.get(f"{GITHUB_API}/repos/{owner}/{repo}", headers=headers)
        if repo_res.status_code == 404:
            raise HTTPException(404, f"Repository not found: {owner}/{repo}")
        if repo_res.status_code == 403:
            raise HTTPException(403, "GitHub API rate limit exceeded. Try again later.")
        repo_res.raise_for_status()
        branch = repo_res.json().get("default_branch", "main")

        # Get tree
        tree_res = await client.get(
            f"{GITHUB_API}/repos/{owner}/{repo}/git/trees/{branch}?recursive=1",
            headers=headers,
        )
        tree_res.raise_for_status()
        return tree_res.json().get("tree", []), repo_res.json()


async def download_file(owner: str, repo: str, path: str, token: str = None) -> str:
    """Download a single file's raw content from GitHub."""
    headers = {"Accept": "application/vnd.github.raw+json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    url = f"{GITHUB_API}/repos/{owner}/{repo}/contents/{path}"
    async with httpx.AsyncClient(timeout=15) as client:
        res = await client.get(url, headers=headers)
        if res.status_code != 200:
            return ""
        # Content may be base64-encoded
        data = res.json()
        if isinstance(data, dict) and data.get("encoding") == "base64":
            import base64
            return base64.b64decode(data["content"]).decode("utf-8", errors="replace")
        return res.text


SUPPORTED_EXTENSIONS = {
    ".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".c", ".h", ".cpp", ".cs",
    ".html", ".htm", ".css", ".scss", ".sql", ".json", ".md", ".yaml", ".yml",
    ".sh", ".toml", ".env", ".rs", ".go", ".rb", ".php", ".vue", ".svelte",
    ".graphql", ".dart", ".lua", ".tf",
}

IGNORED_PATHS = {
    "node_modules", ".git", "__pycache__", "dist", "build", ".venv",
    "venv", "vendor", ".next", "coverage",
}


def should_include(path: str) -> bool:
    parts = path.split("/")
    for part in parts[:-1]:
        if part in IGNORED_PATHS or part.startswith("."):
            return False
    ext = "." + path.rsplit(".", 1)[-1].lower() if "." in path else ""
    return ext in SUPPORTED_EXTENSIONS


@router.post("/import")
async def import_github(req: GitHubImportRequest):
    """Import a public GitHub repository."""
    owner, repo = parse_github_url(req.url)
    if not owner or not repo:
        raise HTTPException(400, "Invalid GitHub URL. Use: https://github.com/owner/repo")

    github_token = os.getenv("GITHUB_TOKEN", "")

    try:
        tree, repo_info = await fetch_repo_tree(owner, repo, github_token or None)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(502, f"Failed to reach GitHub API: {str(e)}")

    # Filter to supported files only
    files_to_fetch = [
        item for item in tree
        if item["type"] == "blob" and should_include(item["path"])
    ][:MAX_REPO_FILES]

    if not files_to_fetch:
        raise HTTPException(400, "No supported source files found in this repository.")

    # Download files into temp directory
    tmp_dir = tempfile.mkdtemp(prefix="codnav_gh_")
    try:
        for item in files_to_fetch:
            file_path = item["path"]
            dest = os.path.join(tmp_dir, file_path.replace("/", os.sep))
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            content = await download_file(owner, repo, file_path, github_token or None)
            if content:
                with open(dest, "w", encoding="utf-8", errors="replace") as fh:
                    fh.write(content)

        project_name = repo_info.get("name", repo)
        project = project_store.create_project(
            name=project_name,
            source="github",
            root_dir=tmp_dir,
            github_url=req.url,
        )
        return {"project": project.to_summary_dict()}

    except HTTPException:
        shutil.rmtree(tmp_dir, ignore_errors=True)
        raise
    except Exception as e:
        shutil.rmtree(tmp_dir, ignore_errors=True)
        raise HTTPException(500, f"Failed to process repository: {str(e)}")


@router.get("/validate")
async def validate_github_url(url: str):
    """Validate a GitHub URL without importing."""
    owner, repo = parse_github_url(url)
    if not owner or not repo:
        return {"valid": False, "error": "Invalid GitHub URL format"}
    return {"valid": True, "owner": owner, "repo": repo}
