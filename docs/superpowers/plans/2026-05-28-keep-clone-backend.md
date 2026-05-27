# Google Keep Clone — Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the FastAPI + MongoDB backend with new note fields (color, pin, labels, checklist, reminder, image) plus storage abstraction, image upload endpoint, and label aggregation endpoint.

**Architecture:** New optional fields are added to the Note model (backward-compatible). A `StorageBackend` protocol with a `LocalStorageBackend` default handles image files. Three new routes are added: image upload, static image serving, and label aggregation.

**Tech Stack:** FastAPI, Motor (async MongoDB), Pydantic v2, pytest-asyncio, Python 3.11+

**Working directory:** `/mnt/c/Users/gonsq/devworks/python-backend-app`

---

## File Map

| Action | File |
|---|---|
| Create | `app/storage.py` |
| Modify | `app/models/note_model.py` |
| Create | `app/routes/labels.py` |
| Modify | `app/routes/notes.py` |
| Modify | `app/main.py` |
| Create | `tests/test_labels.py` |
| Modify | `tests/test_notes.py` |
| Modify | `.gitignore` |

---

### Task 1: Storage abstraction

**Files:**
- Create: `app/storage.py`
- Modify: `.gitignore`

- [ ] **Step 1: Create `app/storage.py`**

```python
import uuid
from pathlib import Path
from typing import Protocol

from fastapi import UploadFile

STORAGE_DIR = Path("storage/images")
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}


class StorageBackend(Protocol):
    async def save(self, filename_hint: str, content: bytes) -> str: ...
    def delete(self, path: str) -> None: ...


class LocalStorageBackend:
    def __init__(self, directory: Path = STORAGE_DIR):
        self.directory = directory
        self.directory.mkdir(parents=True, exist_ok=True)

    async def save(self, filename_hint: str, content: bytes) -> str:
        ext = Path(filename_hint).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            ext = ".bin"
        filename = f"{uuid.uuid4()}{ext}"
        (self.directory / filename).write_bytes(content)
        return filename

    def delete(self, path: str) -> None:
        target = self.directory / path
        if target.exists():
            target.unlink()


def get_storage() -> LocalStorageBackend:
    return LocalStorageBackend()
```

- [ ] **Step 2: Add storage directory to `.gitignore`**

Append to `.gitignore`:
```
storage/images/
```

- [ ] **Step 3: Create the directory with a placeholder so it's tracked**

```bash
mkdir -p storage/images
touch storage/images/.gitkeep
```

- [ ] **Step 4: Commit**

```bash
git add app/storage.py .gitignore storage/images/.gitkeep
git commit -m "feat: add local storage backend for image files"
```

---

### Task 2: Update note model

**Files:**
- Modify: `app/models/note_model.py`

- [ ] **Step 1: Replace `app/models/note_model.py` entirely**

```python
from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field

NoteStatus = Literal["published", "not published", "archived"]
NoteType = Literal["text", "checklist"]
NoteColor = Literal[
    "red", "pink", "orange", "yellow", "teal",
    "green", "cyan", "blue", "purple", "gray"
]


class ChecklistItem(BaseModel):
    text: str
    checked: bool = False


class Note(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    contents: str = Field(default="")
    status: NoteStatus = Field("not published")
    color: Optional[NoteColor] = None
    isPinned: bool = False
    labels: List[str] = Field(default_factory=list)
    noteType: NoteType = "text"
    checklistItems: List[ChecklistItem] = Field(default_factory=list)
    reminderAt: Optional[datetime] = None


class UpdateNote(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    contents: Optional[str] = None
    status: Optional[NoteStatus] = None
    color: Optional[NoteColor] = None
    isPinned: Optional[bool] = None
    labels: Optional[List[str]] = None
    noteType: Optional[NoteType] = None
    checklistItems: Optional[List[ChecklistItem]] = None
    reminderAt: Optional[datetime] = None
```

- [ ] **Step 2: Verify existing tests still pass**

```bash
pytest tests/test_notes.py -v
```

Expected: all existing tests PASS (note model fields are backward-compatible).

- [ ] **Step 3: Commit**

```bash
git add app/models/note_model.py
git commit -m "feat: add keep fields to note model (color, pin, labels, checklist, reminder)"
```

---

### Task 3: Add label aggregation route

**Files:**
- Create: `app/routes/labels.py`

- [ ] **Step 1: Write the failing test**

Create `tests/test_labels.py`:

```python
from types import SimpleNamespace

import pytest

from app.routes import labels as labels_route


class FakeNotesCollection:
    def __init__(self, distinct_result=None):
        self.distinct_result = distinct_result or []
        self.last_field = None
        self.last_filter = None

    async def distinct(self, field, filter_query):
        self.last_field = field
        self.last_filter = filter_query
        return self.distinct_result


from bson import ObjectId


@pytest.mark.asyncio
async def test_get_labels_returns_sorted_distinct_labels():
    user_id = ObjectId("64f1f77bcf86cd7994390111")
    labels_route.notes_collection = FakeNotesCollection(["work", "personal", "ideas"])

    result = await labels_route.get_labels(
        current_user={"_id": user_id, "role": "user", "status": "active"}
    )

    assert result == ["ideas", "personal", "work"]
    assert labels_route.notes_collection.last_field == "labels"
    assert labels_route.notes_collection.last_filter == {"user": str(user_id)}


@pytest.mark.asyncio
async def test_get_labels_returns_empty_list_when_no_labels():
    user_id = ObjectId("64f1f77bcf86cd7994390111")
    labels_route.notes_collection = FakeNotesCollection([])

    result = await labels_route.get_labels(
        current_user={"_id": user_id, "role": "user", "status": "active"}
    )

    assert result == []
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pytest tests/test_labels.py -v
```

Expected: FAIL with `ModuleNotFoundError` or `ImportError` (route doesn't exist yet).

- [ ] **Step 3: Create `app/routes/labels.py`**

```python
from fastapi import APIRouter, Depends

from app.database import db
from app.dependencies.auth import get_current_user

router = APIRouter()
notes_collection = db["notes"]


@router.get("/", summary="Get current user's distinct labels")
async def get_labels(current_user=Depends(get_current_user)):
    user_id = str(current_user["_id"])
    result = await notes_collection.distinct("labels", {"user": user_id})
    return sorted(result)
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_labels.py -v
```

Expected: 2 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add app/routes/labels.py tests/test_labels.py
git commit -m "feat: add GET /api/labels endpoint for user label aggregation"
```

---

### Task 4: Add image upload endpoint

**Files:**
- Modify: `app/routes/notes.py`

- [ ] **Step 1: Write the failing test**

Add to `tests/test_notes.py` (append after existing tests):

```python
class FakeStorage:
    def __init__(self, saved_path="abc123.jpg"):
        self.saved_path = saved_path
        self.deleted_paths = []
        self.save_called_with = None

    async def save(self, filename_hint, content):
        self.save_called_with = (filename_hint, content)
        return self.saved_path

    def delete(self, path):
        self.deleted_paths.append(path)


class FakeUploadFile:
    def __init__(self, filename="photo.jpg", content_type="image/jpeg", content=b"imgdata"):
        self.filename = filename
        self.content_type = content_type
        self._content = content

    async def read(self):
        return self._content


@pytest.mark.asyncio
async def test_upload_note_image_saves_file_and_updates_note():
    from app.routes.notes import upload_note_image
    owner_id = ObjectId("64f1f77bcf86cd7994390111")
    note_id = ObjectId("64f1f77bcf86cd7994390222")
    notes_route.notes_collection = FakeNotesCollection(
        [{"_id": note_id, "title": "T", "contents": "", "status": "not published", "user": str(owner_id)}]
    )
    storage = FakeStorage("new.jpg")

    result = await upload_note_image(
        str(note_id),
        file=FakeUploadFile(),
        current_user={"_id": owner_id, "role": "user", "status": "active"},
        storage=storage,
    )

    assert result == {"imagePath": "new.jpg"}


@pytest.mark.asyncio
async def test_upload_note_image_rejects_invalid_content_type():
    from app.routes.notes import upload_note_image
    owner_id = ObjectId("64f1f77bcf86cd7994390111")
    note_id = ObjectId("64f1f77bcf86cd7994390222")
    notes_route.notes_collection = FakeNotesCollection(
        [{"_id": note_id, "title": "T", "contents": "", "status": "not published", "user": str(owner_id)}]
    )

    with pytest.raises(HTTPException) as exc:
        await upload_note_image(
            str(note_id),
            file=FakeUploadFile(content_type="application/pdf"),
            current_user={"_id": owner_id, "role": "user", "status": "active"},
            storage=FakeStorage(),
        )

    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_upload_note_image_deletes_old_image_before_saving_new():
    from app.routes.notes import upload_note_image
    owner_id = ObjectId("64f1f77bcf86cd7994390111")
    note_id = ObjectId("64f1f77bcf86cd7994390222")
    notes_route.notes_collection = FakeNotesCollection(
        [{"_id": note_id, "title": "T", "contents": "", "status": "not published",
          "user": str(owner_id), "imagePath": "old.jpg"}]
    )
    storage = FakeStorage("new.jpg")

    await upload_note_image(
        str(note_id),
        file=FakeUploadFile(),
        current_user={"_id": owner_id, "role": "user", "status": "active"},
        storage=storage,
    )

    assert "old.jpg" in storage.deleted_paths
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_notes.py::test_upload_note_image_saves_file_and_updates_note -v
```

Expected: FAIL with `ImportError` or `AttributeError`.

- [ ] **Step 3: Add `upload_note_image` to `app/routes/notes.py`**

Add these imports at the top of `app/routes/notes.py`:

```python
from fastapi import File, UploadFile
from app.storage import LocalStorageBackend, get_storage

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB
```

Add this endpoint to `app/routes/notes.py`:

```python
@router.post("/{note_id}/image", summary="Upload image for a note")
async def upload_note_image(
    note_id: str,
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
    storage: LocalStorageBackend = Depends(get_storage),
):
    note = await find_note_or_404(note_id)
    require_note_access(note, current_user)

    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, GIF, and WebP images are allowed")

    content = await file.read()
    if len(content) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail="Image must be under 5MB")

    if note.get("imagePath"):
        storage.delete(note["imagePath"])

    filename = await storage.save(file.filename or "upload", content)

    await notes_collection.update_one(
        {"_id": ObjectId(note_id)},
        {"$set": {"imagePath": filename}},
    )
    return {"imagePath": filename}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_notes.py::test_upload_note_image_saves_file_and_updates_note tests/test_notes.py::test_upload_note_image_rejects_invalid_content_type tests/test_notes.py::test_upload_note_image_deletes_old_image_before_saving_new -v
```

Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add app/routes/notes.py app/storage.py tests/test_notes.py
git commit -m "feat: add POST /api/notes/{id}/image image upload endpoint"
```

---

### Task 5: Update serialize_note, update logic, and delete with image cleanup

**Files:**
- Modify: `app/routes/notes.py`

- [ ] **Step 1: Write failing test for serialize_note returning new fields**

Add to `tests/test_notes.py`:

```python
@pytest.mark.asyncio
async def test_serialize_note_includes_new_keep_fields():
    from app.routes.notes import serialize_note
    note = {
        "_id": ObjectId("64f1f77bcf86cd7994390222"),
        "title": "Keep Note",
        "contents": "",
        "status": "not published",
        "user": "64f1f77bcf86cd7994390111",
        "createdAt": None,
        "updatedAt": None,
        "color": "teal",
        "isPinned": True,
        "labels": ["work"],
        "noteType": "checklist",
        "checklistItems": [{"text": "Item 1", "checked": False}],
        "reminderAt": None,
        "imagePath": "abc.jpg",
    }

    result = serialize_note(note, "Jane Doe")

    assert result["color"] == "teal"
    assert result["isPinned"] is True
    assert result["labels"] == ["work"]
    assert result["noteType"] == "checklist"
    assert result["checklistItems"] == [{"text": "Item 1", "checked": False}]
    assert result["reminderAt"] is None
    assert result["imagePath"] == "abc.jpg"


@pytest.mark.asyncio
async def test_delete_note_cleans_up_image():
    owner_id = ObjectId("64f1f77bcf86cd7994390111")
    note_id = ObjectId("64f1f77bcf86cd7994390222")
    notes_route.notes_collection = FakeNotesCollection(
        [{"_id": note_id, "title": "T", "contents": "", "status": "not published",
          "user": str(owner_id), "imagePath": "old.jpg"}]
    )
    storage = FakeStorage()
    notes_route.get_storage = lambda: storage

    await notes_route.delete_note(
        str(note_id),
        current_user={"_id": owner_id, "role": "user", "status": "active"},
    )

    assert "old.jpg" in storage.deleted_paths
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_notes.py::test_serialize_note_includes_new_keep_fields tests/test_notes.py::test_delete_note_cleans_up_image -v
```

Expected: FAIL.

- [ ] **Step 3: Update `serialize_note` in `app/routes/notes.py`**

Replace the existing `serialize_note` function:

```python
def serialize_note(note, user_name: str = None):
    return {
        "id": str(note["_id"]),
        "title": note["title"],
        "contents": note.get("contents", ""),
        "status": note.get("status", "not published"),
        "user": note["user"],
        "userName": user_name or note["user"],
        "createdAt": note.get("createdAt"),
        "updatedAt": note.get("updatedAt"),
        "color": note.get("color"),
        "isPinned": note.get("isPinned", False),
        "labels": note.get("labels", []),
        "noteType": note.get("noteType", "text"),
        "checklistItems": note.get("checklistItems", []),
        "reminderAt": note.get("reminderAt"),
        "imagePath": note.get("imagePath"),
    }
```

- [ ] **Step 4: Update `update_note` to use `model_fields_set` (supports clearing `reminderAt`)**

In `update_note`, replace:

```python
update_data = {
    key: value
    for key, value in model_to_dict(updated_note).items()
    if value is not None
}
```

With:

```python
update_data = {
    key: value
    for key, value in model_to_dict(updated_note).items()
    if key in updated_note.model_fields_set
}
```

- [ ] **Step 5: Update `delete_note` to delete image file**

Replace the existing `delete_note` function:

```python
@router.delete("/{note_id}", summary="Delete note by ID")
async def delete_note(note_id: str, current_user=Depends(get_current_user)):
    note = await find_note_or_404(note_id)
    require_note_access(note, current_user)

    result = await notes_collection.delete_one({"_id": ObjectId(note_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")

    if note.get("imagePath"):
        get_storage().delete(note["imagePath"])

    return {"message": "Note deleted successfully"}
```

- [ ] **Step 6: Run all tests**

```bash
pytest tests/ -v
```

Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add app/routes/notes.py tests/test_notes.py
git commit -m "feat: update note serialization and deletion to include keep fields and image cleanup"
```

---

### Task 6: Register new routes and mount static file serving

**Files:**
- Modify: `app/main.py`

- [ ] **Step 1: Update `app/main.py`**

Replace the full file:

```python
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.database import client, ensure_database_indexes
from app.routes import auth, labels, notes, users
from app.storage import STORAGE_DIR

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await ensure_database_indexes()
    except Exception:
        logger.exception("Failed to initialize database indexes")
        raise
    yield
    client.close()


app = FastAPI(lifespan=lifespan)

origins = get_settings().cors_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STORAGE_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/api/images", StaticFiles(directory=str(STORAGE_DIR)), name="images")

app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(notes.router, prefix="/api/notes", tags=["Notes"])
app.include_router(labels.router, prefix="/api/labels", tags=["Labels"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])


@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "backend app is running."}
```

- [ ] **Step 2: Run all tests**

```bash
pytest tests/ -v
```

Expected: all tests PASS.

- [ ] **Step 3: Start the dev server and verify**

```bash
uvicorn app.main:app --reload --port 4000
```

Visit `http://localhost:4000/docs` — confirm `/api/labels`, `/api/notes/{id}/image`, and `/api/images/{filename}` appear.

- [ ] **Step 4: Commit**

```bash
git add app/main.py
git commit -m "feat: register labels router and mount static image file serving"
```
