
# WorkSphere DevPlanner — API Integration Guide (Frontend Team)

This guide documents all REST endpoints, request/response models, validations, and logic flows needed to connect the React + TypeScript frontend to the FastAPI backend.

---

## 1. Global Setup & Standards

### 1.1 Base URL
All API requests must be prefixed with:
```
http://localhost:8000/api/v1
```

### 1.2 Date Management
All dates used in parameters and JSON bodies must follow the `YYYY-MM-DD` string format (e.g., `2026-07-09`). The client should resolve this format using the user's local browser timezone.

### 1.3 Standard Response Envelope
All API endpoints return responses using a standardized JSON wrapper:

#### Success Response (HTTP 200 / 201)
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

#### Failure Response (HTTP 400 / 404 / 422 / 500)
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "[body -> title]: field required; [body -> date]: string does not match regex"
  }
}
```

---

## 2. Module 1: Home Dashboard

### 2.1 Get Today's Tasks
Retrieves all tasks scheduled for a specific date.

*   **URL:** `/tasks`
*   **Method:** `GET`
*   **Query Parameters:**
    | Parameter | Type | Required | Default | Description |
    |---|---|---|---|---|
    | `date` | String | No | Today's Date | Date in `YYYY-MM-DD` format |
    | `search` | String | No | None | Text query to search title and description |
    | `status` | String | No | None | Filter state: `completed` or `pending` |
    | `sort_by` | String | No | None | Sorting order: `alphabetical`, `recently_added`, or `recently_updated` |

*   **Response Data Pattern (`data` field):**
    ```json
    [
      {
        "_id": "6a4f948f77e9b1b0333d7211",
        "title": "Build Flutter Dashboard Login Screen",
        "description": "Design UI screens and bind authentication hooks.",
        "date": "2026-07-08",
        "is_completed": false,
        "origin_task_id": null,
        "subtasks": [
          {
            "id": "18cf1b37-25e2-4bd5-a131-7b0b6c698188",
            "title": "Design Figma login screen layouts",
            "is_completed": true,
            "created_at": "2026-07-09T12:31:09.123Z"
          }
        ],
        "created_at": "2026-07-09T12:31:09.123Z",
        "updated_at": "2026-07-09T12:31:09.123Z",
        "is_deleted": false,
        "status": "active",
        "version": 1
      }
    ]
    ```

---

### 2.1.1 Get Strict Tasks by Date
Retrieves only the tasks strictly scheduled for a specific date (excluding overdue tasks).

*   **URL:** `/tasks/date/{date}`
*   **Method:** `GET`
*   **Path Parameters:**
    *   `date` (String, Required): Date in `YYYY-MM-DD` format (e.g., `2026-07-11`).
*   **Query Parameters:**
    | Parameter | Type | Required | Default | Description |
    |---|---|---|---|---|
    | `search` | String | No | None | Text query to search title and description |
    | `status` | String | No | None | Filter state: `completed` or `pending` |
    | `sort_by` | String | No | None | Sorting order: `alphabetical`, `recently_added`, or `recently_updated` |

*   **Response Data Pattern (`data` field):** Same as `/tasks` endpoint, but containing only tasks explicitly set on the target date.

---

## 2.2 Create a Task
Creates a new task with optional hierarchical subtasks.

*   **URL:** `/tasks`
*   **Method:** `POST`
*   **Request Body:**
    ```json
    {
      "title": "Develop FastAPI MVC controllers",
      "description": "Add routes matching requirements specification.",
      "date": "2026-07-09",
      "subtasks": [
        {
          "title": "Create tasks endpoint",
          "is_completed": false
        }
      ]
    }
    ```
*   **Response Data:** Returns the created task object (containing generated `_id` and subtask `id` strings).

---

### 2.3 Update a Task
Updates the task title, description, or scheduled date.

*   **URL:** `/tasks/{task_id}`
*   **Method:** `PUT`
*   **Request Body:**
    ```json
    {
      "title": "Develop MVC Routers",
      "description": "New description details",
      "date": "2026-07-09"
    }
    ```
*   **Response Data:** Returns the updated task object.

---

### 2.4 Soft-Delete a Task
Marks a task as deleted without erasing history.

*   **URL:** `/tasks/{task_id}`
*   **Method:** `DELETE`
*   **Response Data:** `true`

---

### 2.5 Toggle Task Completion
Toggles the completion status of the task.

*   **URL:** `/tasks/{task_id}/complete`
*   **Method:** `PATCH`
*   **Query Parameters:**
    | Parameter | Type | Required | Default | Description |
    |---|---|---|---|---|
    | `is_completed` | Boolean | No | Oppose State | Force state if passed, else toggles |

*   **Response Data:** Returns the updated task object.

---

### 2.6 Global Task Search
Searches tasks across all dates.

*   **URL:** `/tasks/search`
*   **Method:** `GET`
*   **Query Parameters:**
    *   `q` (String, Required): Search query string.
*   **Response Data:** Returns list of matching task objects.

---

### 2.7 Add a Subtask
Appends a subtask to an existing task document.

*   **URL:** `/tasks/{task_id}/subtasks`
*   **Method:** `POST`
*   **Request Body:**
    ```json
    {
      "title": "Integrate database clients",
      "is_completed": false
    }
    ```
*   **Response Data:** Returns the updated task object.

---

### 2.8 Edit a Subtask
Edits the details of a subtask.

*   **URL:** `/tasks/{task_id}/subtasks/{subtask_id}`
*   **Method:** `PUT`
*   **Request Body:**
    ```json
    {
      "title": "Integrate DB",
      "is_completed": true
    }
    ```
*   **Response Data:** Returns the updated task object.

---

### 2.9 Delete a Subtask
Removes a subtask from a task.

*   **URL:** `/tasks/{task_id}/subtasks/{subtask_id}`
*   **Method:** `DELETE`
*   **Response Data:** Returns the updated task object.

---

### 2.10 Toggle Subtask Completion
Toggles the subtask completion status.

*   **URL:** `/tasks/{task_id}/subtasks/{subtask_id}/complete`
*   **Method:** `PATCH`
*   **Query Parameters:**
    *   `is_completed` (Boolean, Optional): Force state, otherwise toggles current value.
*   **Response Data:** Returns the updated task object.

---

## 3. Module 2: Calendar Planner

### 3.1 Get Month Overview (Status Indicators)
Fetches highlighting states for a monthly grid calendar.

*   **URL:** `/calendar/{year}/{month}`
*   **Method:** `GET`
*   **Response Data:**
    Returns a dictionary mapping date strings `YYYY-MM-DD` to indicator states:
    *   `none`: No tasks scheduled.
    *   `completed`: All tasks on this date are completed.
    *   `pending`: All tasks on this date are pending.
    *   `mixed`: Some tasks on this date are completed, others are pending.

    ```json
    {
      "2026-07-01": "none",
      "2026-07-08": "mixed",
      "2026-07-09": "completed",
      "2026-07-10": "pending"
    }
    ```

---

### 3.2 Get Tasks for Calendar Day
Alias endpoint to retrieve tasks for a selected calendar day.

*   **URL:** `/calendar/day/{date}`
*   **Method:** `GET`
*   **Response Data:** List of task objects on that date (same as `/tasks?date=YYYY-MM-DD`).

---

### 3.3 Get Strict Tasks for Calendar Day
Retrieves only the tasks strictly scheduled on a specific date (excluding overdue tasks) for calendar views.

*   **URL:** `/calendar/day/{date}/strict`
*   **Method:** `GET`
*   **Path Parameters:**
    *   `date` (String, Required): Date in `YYYY-MM-DD` format.
*   **Response Data:** List of task objects strictly scheduled on that date (same output format as `/tasks/date/{date}`).

---

## 4. Module 3: Link Manager

### 4.1 List Categories
List folders inside the reference link bookmark system.

*   **URL:** `/link-categories`
*   **Method:** `GET`
*   **Response Data:**
    ```json
    [
      {
        "_id": "6a4f948f77e9b1b0333d7211",
        "name": "Flutter",
        "created_at": "2026-07-09T12:31:09.123Z",
        "updated_at": "2026-07-09T12:31:09.123Z",
        "is_deleted": false,
        "status": "active",
        "version": 1
      }
    ]
    ```

---

### 4.2 Create Category Folder
*   **URL:** `/link-categories`
*   **Method:** `POST`
*   **Request Body:**
    ```json
    {
      "name": "New Technology"
    }
    ```
*   **Response Data:** Returns the created category object.

---

### 4.3 Rename Category
*   **URL:** `/link-categories/{id}`
*   **Method:** `PUT`
*   **Request Body:**
    ```json
    {
      "name": "Updated Tech Name"
    }
    ```
*   **Response Data:** Returns the updated category object.

---

### 4.4 Soft-Delete Category Folder
Soft-deletes the category and all links stored inside it.

*   **URL:** `/link-categories/{id}`
*   **Method:** `DELETE`
*   **Response Data:** `true`

---

### 4.5 List Links inside a Category
Lists links with filter search and sorting options.

*   **URL:** `/link-categories/{id}/links`
*   **Method:** `GET`
*   **Query Parameters:**
    | Parameter | Type | Required | Default | Description |
    |---|---|---|---|---|
    | `search` | String | No | None | Text query to search in title, subtitle, or notes |
    | `sort_by` | String | No | None | Sort order: `alphabetical`, `recently_added`, `recently_updated` |

*   **Response Data:**
    ```json
    [
      {
        "_id": "6a4f948f77e9b1b0333d72a9",
        "category_id": "6a4f948f77e9b1b0333d7211",
        "title": "Flutter Documentation",
        "subtitle": "Official SDK reference docs",
        "url": "https://docs.flutter.dev",
        "notes": "Bookmark for UI widget catalog and development guides.",
        "created_at": "2026-07-09T12:31:09.123Z",
        "updated_at": "2026-07-09T12:31:09.123Z",
        "is_deleted": false,
        "status": "active",
        "version": 1
      }
    ]
    ```

---

### 4.6 Add Link to Category Folder
Creates a link card under a category folder. Validates URL format and optional duplicates.

*   **URL:** `/link-categories/{id}/links`
*   **Method:** `POST`
*   **Query Parameters:**
    *   `prevent_duplicate` (Boolean, Default: `true`): Prevents insertion of matching URL inside this category folder.
*   **Request Body:**
    ```json
    {
      "title": "React Docs",
      "subtitle": "Hooks reference",
      "url": "https://react.dev",
      "notes": "Helpful notes"
    }
    ```
*   **Response Data:** Returns the created link object.

---

### 4.7 Edit Link
Updates details or moves a link to a different category folder.

*   **URL:** `/links/{id}`
*   **Method:** `PUT`
*   **Request Body:**
    ```json
    {
      "title": "New Title",
      "subtitle": "New Subtitle",
      "url": "https://new-url.com",
      "notes": "New Notes",
      "category_id": "6a4f948f77e9b1b0333d7212" 
    }
    ```
    *(Specify only the fields you wish to change. `category_id` can be used to move the link between folders.)*
*   **Response Data:** Returns the updated link object.

---

### 4.8 Delete Link Card
Soft-deletes a link.

*   **URL:** `/links/{id}`
*   **Method:** `DELETE`
*   **Response Data:** `true`

---

### 4.9 Global Link Search
*   **URL:** `/links/search`
*   **Method:** `GET`
*   **Query Parameters:**
    *   `q` (String, Required): Search query string.
*   **Response Data:** List of link objects across all categories.

---

## 5. Metrics & Task Lineage Tracker

### 5.1 Dashboard Statistics Summary
Fetches daily completion rates and subtask statistics.

*   **URL:** `/dashboard/stats`
*   **Method:** `GET`
*   **Query Parameters:**
    *   `date` (String, Optional): Date query. Defaults to today's date.
*   **Response Data:**
    ```json
    {
      "total_tasks": 5,
      "completed_tasks": 2,
      "pending_tasks": 3,
      "total_subtasks": 8,
      "completed_subtasks": 4
    }
    ```

---

### 5.2 Catchup Migration Job
Runs the daily task migration catches. If there are missing offline days in the migration logs database, it migrates them sequentially day-by-day.

*   **URL:** `/migration/run`
*   **Method:** `POST`
*   **Query Parameters:**
    *   `date` (String, Optional): Target catchup date. Defaults to today's date.
*   **Response Data:** Lists status steps performed during catch-up:
    ```json
    [
      {
        "status": "success",
        "date": "2026-07-09",
        "migrated_count": 2
      }
    ]
    ```

---

### 5.3 Fetch Task History Lineage
Traces the ancestry of a task that has migrated across multiple days.

*   **URL:** `/history/{task_id}`
*   **Method:** `GET`
*   **Response Data:**
    Returns a chronologically ordered list of ancestor tasks (from today's task back to the original source task):
    ```json
    [
      {
        "date": "2026-07-09",
        "title": "Build Flutter Dashboard Login Screen",
        "_id": "6a4f93457baeabd23f71b20b",
        "origin_task_id": "6a4f93457baeabd23f71b20a"
      },
      {
        "date": "2026-07-08",
        "title": "Build Flutter Dashboard Login Screen",
        "_id": "6a4f93457baeabd23f71b20a",
        "origin_task_id": null
      }
    ]

---

## 6. Module 4: Notes Manager (Markdown)

### 6.1 List Categories (Folders)
Lists note folders.

*   **URL:** `/note-categories`
*   **Method:** `GET`
*   **Response Data:**
    ```json
    [
      {
        "_id": "6a4fa4342af77fdb18de7bc1",
        "name": "General Notes",
        "created_at": "2026-07-10T11:27:00Z",
        "updated_at": "2026-07-10T11:27:00Z",
        "is_deleted": false,
        "status": "active",
        "version": 1
      }
    ]
    ```

---

### 6.2 Create Category Folder
Creates a new note category folder.

*   **URL:** `/note-categories`
*   **Method:** `POST`
*   **Request Body:**
    ```json
    {
      "name": "Project Guidelines"
    }
    ```
*   **Response Data:** Returns the created category folder object.

---

### 6.3 Rename Category Folder
*   **URL:** `/note-categories/{id}`
*   **Method:** `PUT`
*   **Request Body:**
    ```json
    {
      "name": "Revised Project Guidelines"
    }
    ```
*   **Response Data:** Returns the updated category folder object.

---

### 6.4 Soft-Delete Category Folder
Soft-deletes the category folder and all notes inside it.

*   **URL:** `/note-categories/{id}`
*   **Method:** `DELETE`
*   **Response Data:** `true`

---

### 6.5 List Notes inside a Category Folder
Lists notes under a category folder. Supports filters and sorting.

*   **URL:** `/note-categories/{id}/notes`
*   **Method:** `GET`
*   **Query Parameters:**
    | Parameter | Type | Required | Default | Description |
    |---|---|---|---|---|
    | `search` | String | No | None | Text query to search note titles and content |
    | `sort_by` | String | No | None | Sort order: `alphabetical`, `recently_added`, `recently_updated` |

*   **Response Data:**
    ```json
    [
      {
        "_id": "6a4fa4342af77fdb18de7bc5",
        "category_id": "6a4fa4342af77fdb18de7bc1",
        "title": "Flutter Development Setup",
        "content": "# Flutter Development Guidelines\n\nEnsure you configure the Flutter SDK correctly.",
        "created_at": "2026-07-10T11:27:00Z",
        "updated_at": "2026-07-10T11:27:00Z",
        "is_deleted": false,
        "status": "active",
        "version": 1
      }
    ]
    ```

---

### 6.6 Create Note in Category Folder
Creates a note inside a category folder. Content should be a Markdown README formatted string.

*   **URL:** `/note-categories/{id}/notes`
*   **Method:** `POST`
*   **Request Body:**
    ```json
    {
      "title": "React Architecture Note",
      "content": "# React Architecture\n\nWe use next.js features."
    }
    ```
*   **Response Data:** Returns the created note item object.

---

### 6.7 Get Single Note (Markdown Content)
Retrieves note details and its Markdown formatted body content.

*   **URL:** `/notes/{id}`
*   **Method:** `GET`
*   **Response Data:** Returns the note item object (as shown above).

---

### 6.8 Edit Note
Updates details (title or Markdown content) or moves the note between category folders.

*   **URL:** `/notes/{id}`
*   **Method:** `PUT`
*   **Request Body:**
    ```json
    {
      "title": "Updated Note Title",
      "content": "## Updated Heading\n\nNew markdown content.",
      "category_id": "6a4fa4342af77fdb18de7bc2"
    }
    ```
    *(Specify only fields to be modified. `category_id` can be used to move notes between folders.)*
*   **Response Data:** Returns the updated note item object.

---

### 6.9 Delete Note
Soft-deletes a note.

*   **URL:** `/notes/{id}`
*   **Method:** `DELETE`
*   **Response Data:** `true`

---

### 6.10 Global Note Search
*   **URL:** `/notes/search`
*   **Method:** `GET`
*   **Query Parameters:**
    *   `q` (String, Required): Text query to search across titles and Markdown contents.
*   **Response Data:** List of matching note objects.
    ```
