"""
Projects Router — handles project upload, listing, file content retrieval, demo loading.
"""
import os
import shutil
import tempfile
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse

from services import project_store
from services.file_scanner import extract_zip

router = APIRouter()

MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_SIZE_MB", "50")) * 1024 * 1024

DEMO_DIR = os.path.join(os.path.dirname(__file__), "..", "demo", "student_management")
DEMO_DIR = os.path.normpath(DEMO_DIR)

_demo_project_id: str = None  # cached demo project ID


@router.get("/")
async def list_projects():
    """Return all loaded projects."""
    return {"projects": project_store.list_projects()}


@router.post("/upload")
async def upload_project(
    file: UploadFile = File(...),
    name: str = Form(None),
):
    """Upload a ZIP file and create a new project."""
    if not file.filename.endswith(".zip"):
        raise HTTPException(400, "Only ZIP files are supported")

    # Read and size-check
    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, f"File too large. Maximum size is {MAX_UPLOAD_BYTES // 1024 // 1024} MB")

    # Save to temp file
    tmp_dir = tempfile.mkdtemp(prefix="codnav_")
    zip_path = os.path.join(tmp_dir, "upload.zip")

    try:
        with open(zip_path, "wb") as f:
            f.write(content)

        extract_dir = os.path.join(tmp_dir, "extracted")
        os.makedirs(extract_dir)
        root_dir = extract_zip(zip_path, extract_dir)

        project_name = name or (file.filename.replace(".zip", "") or "Untitled Project")
        project = project_store.create_project(
            name=project_name,
            source="upload",
            root_dir=root_dir,
        )
        os.remove(zip_path)
        return {"project": project.to_summary_dict()}

    except ValueError as e:
        shutil.rmtree(tmp_dir, ignore_errors=True)
        raise HTTPException(400, str(e))
    except Exception as e:
        shutil.rmtree(tmp_dir, ignore_errors=True)
        raise HTTPException(500, f"Failed to process upload: {str(e)}")


@router.get("/demo")
async def load_demo():
    """Load the built-in demo project (Student Management System)."""
    global _demo_project_id
    if _demo_project_id and project_store.get_project(_demo_project_id):
        return {"project": project_store.get_project(_demo_project_id).to_summary_dict()}

    if not os.path.isdir(DEMO_DIR):
        raise HTTPException(500, "Demo project files not found. Check installation.")

    try:
        project = project_store.create_project(
            name="Student Management System",
            source="demo",
            root_dir=DEMO_DIR,
        )
        _demo_project_id = project.id
        return {"project": project.to_summary_dict()}
    except Exception as e:
        raise HTTPException(500, f"Failed to load demo: {str(e)}")


@router.get("/{project_id}")
async def get_project(project_id: str):
    """Get a project's full details."""
    project = project_store.get_project(project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    return {"project": project.to_summary_dict()}


@router.delete("/{project_id}")
async def delete_project(project_id: str):
    """Delete a project."""
    deleted = project_store.delete_project(project_id)
    if not deleted:
        raise HTTPException(404, "Project not found")
    return {"message": "Project deleted successfully"}


@router.get("/{project_id}/file")
async def get_file_content(project_id: str, path: str):
    """Get the content of a specific file in the project."""
    project = project_store.get_project(project_id)
    if not project:
        raise HTTPException(404, "Project not found")

    content = project.get_file_content(path)
    if not content:
        raise HTTPException(404, f"File not found: {path}")

    return {"file": content}
