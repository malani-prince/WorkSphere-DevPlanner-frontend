# 📝 Notes Manager Module — API Integration & Setup Guide

This README documents the **Notes Manager Module** endpoints, request/response models, database design, and Markdown formatting constraints.

---

## 1. Overview
The Notes Module is a folder-categorized documentation repository.
*   **Markdown Support:** Notes accept standard Markdown/README formatted strings for their `content` field.
*   **Categories (Folders):** Notes must belong to a parent folder/category. Soft-deleting a folder will automatically cascade and soft-delete all notes inside it.
*   **Soft Deletion:** Deletes mark records as `is_deleted: true` to preserve user history.

---

## 2. Database Schema

### `note_categories` Collection
```json
{
  "_id": "ObjectId",
  "name": "String (Unique folder name)",
  "created_at": "ISODate",
  "updated_at": "ISODate",
  "is_deleted": false,
  "status": "active",
  "version": 1
}
```

### `notes` Collection
```json
{
  "_id": "ObjectId",
  "category_id": "ObjectId (Points to note_categories)",
  "title": "String",
  "content": "String (Markdown README formatted content)",
  "created_at": "ISODate",
  "updated_at": "ISODate",
  "is_deleted": false,
  "status": "active",
  "version": 1
}
```

---

## 3. Standard API Envelope

### Successful Response
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

### Error Response
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "[body -> title]: field required"
  }
}
```

---

## 4. Endpoints Checklist & Response Examples

### 4.1 List Folders (Categories)
Retrieve all active note categories.

*   **URL:** `/note-categories`
*   **Method:** `GET`
*   **Response Model:** `ApiResponse[List[NoteCategoryResponse]]`
*   **Response Example:**
    ```json
    {
      "success": true,
      "data": [
        {
          "_id": "6a508a60518769bfc77e8e66",
          "name": "General Notes",
          "created_at": "2026-07-10T11:27:00Z",
          "updated_at": "2026-07-10T11:27:00Z",
          "is_deleted": false,
          "status": "active",
          "version": 1
        }
      ],
      "error": null
    }
    ```

---

### 4.2 Create Folder
Create a new category folder. Category names must be unique.

*   **URL:** `/note-categories`
*   **Method:** `POST`
*   **Request Body:**
    ```json
    {
      "name": "Project Architecture Guidelines"
    }
    ```
*   **Response Model:** `ApiResponse[NoteCategoryResponse]`
*   **Response Example:**
    ```json
    {
      "success": true,
      "data": {
        "_id": "6a508a60518769bfc77e8e90",
        "name": "Project Architecture Guidelines",
        "created_at": "2026-07-10T11:32:00Z",
        "updated_at": "2026-07-10T11:32:00Z",
        "is_deleted": false,
        "status": "active",
        "version": 1
      },
      "error": null
    }
    ```

---

### 4.3 Rename Folder
Change the name of a folder.

*   **URL:** `/note-categories/{folder_id}`
*   **Method:** `PUT`
*   **Request Body:**
    ```json
    {
      "name": "Backend Guidelines"
    }
    ```
*   **Response Model:** `ApiResponse[NoteCategoryResponse]`

---

### 4.4 Delete Folder
Soft-deletes the folder and soft-deletes all notes currently stored inside it.

*   **URL:** `/note-categories/{folder_id}`
*   **Method:** `DELETE`
*   **Response Model:** `ApiResponse[bool]`
*   **Response Example:**
    ```json
    {
      "success": true,
      "data": true,
      "error": null
    }
    ```

---

### 4.5 List Notes under Folder
Retrieves all notes inside a category folder. Supports title/content queries and sorting.

*   **URL:** `/note-categories/{folder_id}/notes`
*   **Method:** `GET`
*   **Query Parameters:**
    | Parameter | Type | Required | Default | Description |
    |---|---|---|---|---|
    | `search` | String | No | None | Text query searching note titles and content |
    | `sort_by` | String | No | None | Sort order: `alphabetical`, `recently_added`, `recently_updated` |

*   **Response Model:** `ApiResponse[List[NoteResponse]]`
*   **Response Example:**
    ```json
    {
      "success": true,
      "data": [
        {
          "_id": "6a508a60518769bfc77e8e67",
          "category_id": "6a508a60518769bfc77e8e66",
          "title": "Development Setup Guide",
          "content": "# Development Guide\n\n## Prerequisites\n* Python 3.10+\n* MongoDB local instance",
          "created_at": "2026-07-10T11:27:00Z",
          "updated_at": "2026-07-10T11:27:00Z",
          "is_deleted": false,
          "status": "active",
          "version": 1
        }
      ],
      "error": null
    }
    ```

---

### 4.6 Create Note in Folder
Create a new Markdown note inside a category folder.

*   **URL:** `/note-categories/{folder_id}/notes`
*   **Method:** `POST`
*   **Request Body:**
    ```json
    {
      "title": "FastAPI Setup Rules",
      "content": "# Setup Guidelines\n\n1. Run `pip install`.\n2. Run `uvicorn main:app`."
    }
    ```
*   **Response Model:** `ApiResponse[NoteResponse]`

---

### 4.7 Get Single Note (Markdown Content)
Retrieves a single note by its ID, exposing its full markdown content.

*   **URL:** `/notes/{note_id}`
*   **Method:** `GET`
*   **Response Model:** `ApiResponse[NoteResponse]`

---

### 4.8 Update Note details
Edits a note's title, markdown body content, or moves the note between different folder categories.

*   **URL:** `/notes/{note_id}`
*   **Method:** `PUT`
*   **Request Body:**
    ```json
    {
      "title": "FastAPI Setup Guide",
      "content": "# Setup Guidelines\n\n3. Open `http://localhost:8000/docs`",
      "category_id": "6a508a60518769bfc77e8e90"
    }
    ```
    *(Send only the fields you wish to modify. Provide `category_id` to move notes between category folders.)*
*   **Response Model:** `ApiResponse[NoteResponse]`

---

### 4.9 Delete Note
Soft-deletes a note item.

*   **URL:** `/notes/{note_id}`
*   **Method:** `DELETE`
*   **Response Model:** `ApiResponse[bool]`

---

### 4.10 Global Notes Search
Searches note titles and markdown body content globally across all folder categories.

*   **URL:** `/notes/search`
*   **Method:** `GET`
*   **Query Parameters:**
    *   `q` (String, Required): Search query term.
*   **Response Model:** `ApiResponse[List[NoteResponse]]`
