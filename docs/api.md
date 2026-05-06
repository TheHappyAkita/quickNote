# API Reference

All API routes are served under `/api/`. Authentication is required — requests without a valid session cookie are rejected with `401 Unauthorized`.

---

## Authentication

### `POST /api/auth/login`

Log in with username and password.

**Request body:**
```json
{ "username": "alice", "password": "yourpassword" }
```

**Response:** `200 OK` with session cookie set, or `401 Unauthorized`.

---

### `POST /api/auth/logout`

Clear the session.

**Response:** `200 OK`.

---

### `GET /api/auth/session`

Get the currently authenticated user.

**Response:**
```json
{ "user": { "username": "alice" } }
```

---

## Daily Notes

### `GET /api/notes`

List all daily note dates (sorted ascending).

**Response:**
```json
["2025-10-01", "2025-10-14", "2025-10-15"]
```

---

### `GET /api/notes/[date]`

Get the content of a daily note.

**Path param:** `date` — format `YYYY-MM-DD`

**Response:**
```json
{ "date": "2025-10-14", "content": "# Monday\n\nToday I..." }
```

Returns `{ content: "" }` if the note does not exist yet.

---

### `POST /api/notes/[date]`

Create or update a daily note.

**Path param:** `date` — format `YYYY-MM-DD`

**Request body:**
```json
{ "content": "# Monday\n\nToday I..." }
```

**Response:** `200 OK`

---

### `GET /api/notes/previews`

Get short preview excerpts for all daily notes (first 120 characters of content).

**Response:**
```json
{
  "2025-10-14": "Picked up the Harmonica again today...",
  "2025-10-15": "Started reading a new book..."
}
```

---

### `GET /api/notes/graph`

Build and return the knowledge graph data (nodes + edges).

**Response:**
```json
{
  "nodes": [
    { "data": { "id": "2025-10-14", "label": "2025-10-14", "type": "date" } },
    { "data": { "id": "page:Harmonica", "label": "Harmonica", "type": "page" } },
    { "data": { "id": "kw:harmonica", "label": "harmonica", "type": "keyword", "weight": 5 } }
  ],
  "edges": [
    { "data": { "id": "2025-10-14->page:Harmonica", "source": "2025-10-14", "target": "page:Harmonica", "type": "wikilink" } }
  ]
}
```

---

### `GET /api/notes/reminders`

Get all active reminders and alerts from all notes.

**Response:**
```json
[
  { "date": "2025-10-14", "text": "call the dentist", "keyword": "remind" },
  { "date": "2025-10-14", "text": "submit report", "keyword": "alert", "alertDate": "2025-11-01" }
]
```

---

### `POST /api/notes/reminders/dismiss`

Dismiss a reminder so it no longer appears.

**Request body:**
```json
{ "date": "2025-10-14", "text": "call the dentist" }
```

**Response:** `200 OK`

---

## Named Pages

### `GET /api/pages`

List all pages with their tags.

**Response:**
```json
[
  { "name": "Harmonica", "tags": ["music", "hobby"] },
  { "name": "Book List", "tags": ["reading"] }
]
```

---

### `GET /api/pages/[name]`

Get a named page's content.

**Path param:** `name` — the page name (URL-encoded if it contains spaces)

**Response:**
```json
{ "name": "Harmonica", "content": "---\ntags: [music]\n---\n\n# Harmonica\n\n..." }
```

Returns `404` if the page does not exist.

---

### `POST /api/pages/[name]`

Create or update a named page.

**Request body:**
```json
{ "content": "---\ntags: [music]\n---\n\n# Harmonica\n\n..." }
```

**Response:** `200 OK`

---

### `DELETE /api/pages/[name]`

Delete a named page permanently.

**Response:** `200 OK`

---

### `GET /api/pages/previews`

Get short preview excerpts for all named pages.

**Response:**
```json
{
  "Harmonica": "The harmonica is a free reed wind instrument...",
  "Book List": "Books I want to read..."
}
```

---

## Search

### `GET /api/search?q=<query>`

Full-text search across all daily notes and named pages.

**Query param:** `q` — search string (minimum 2 characters)

**Response:**
```json
[
  {
    "type": "page",
    "id": "Harmonica",
    "title": "Harmonica",
    "excerpt": "...notes about playing #music and bending...",
    "matches": 3
  },
  {
    "type": "note",
    "id": "2025-10-14",
    "title": "2025-10-14",
    "excerpt": "...picked up the Harmonica again today...",
    "matches": 1
  }
]
```

Results are sorted by match count descending.

---

## Canvas

### `GET /api/canvas`

List all canvas boards (metadata only).

**Response:**
```json
[
  { "id": "default", "name": "Default", "createdAt": "...", "updatedAt": "..." }
]
```

---

### `GET /api/canvas/[id]`

Get the state of a canvas board.

**Response:**
```json
{
  "cards": [
    { "id": "abc", "type": "note", "date": "2025-10-14", "x": 100, "y": 200 }
  ],
  "edges": []
}
```

---

### `POST /api/canvas/[id]`

Save the state of a canvas board.

**Request body:** Full `CanvasState` object (cards + edges).

**Response:** `200 OK`

---

### `POST /api/canvas`

Create a new canvas board.

**Request body:**
```json
{ "name": "Project Overview" }
```

**Response:**
```json
{ "id": "proj-overview", "name": "Project Overview", "createdAt": "...", "updatedAt": "..." }
```

---

### `PATCH /api/canvas/[id]`

Rename a canvas.

**Request body:**
```json
{ "name": "New Name" }
```

**Response:** `200 OK`

---

### `DELETE /api/canvas/[id]`

Delete a canvas board.

**Response:** `200 OK`
