# quickNote

A lightweight, self-hosted personal knowledge base and daily note-taking app — inspired by Obsidian, built with Nuxt 4.

> **All your notes are plain Markdown files on your filesystem.** No database, no lock-in.

---

## Features

### ✏️ Daily Notes
One Markdown file per day (`YYYY-MM-DD.md`). Navigate via:
- **📅** Today icon — instant jump to today's note
- **🗓** Calendar icon — date picker to jump to any date
- **← →** Arrows — previous/next note chronologically

Auto-saves on blur; manual save via **Ctrl+S** or the save icon.

### 📄 Named Pages
Create persistent reference pages (e.g. *Book List*, *Project Ideas*, *Harmonica*). Pages are separate Markdown files stored in `~/.quickNote/pages/`.

### 🏷️ Tags
Organize pages with tags — two ways to add them:
- **YAML frontmatter** (explicit, structured):
  ```markdown
  ---
  tags: [music, project, hobby]
  ---
  ```
- **Inline hashtags** anywhere in the content:
  ```markdown
  This page covers #music and #theory.
  ```
Tags appear as filter chips in the Pages browser.

### 🔗 Wikilinks
Link between notes and pages using `[[...]]` syntax:
- `[[2025-10-14]]` — links to a daily note
- `[[Harmonica]]` — links to a named page

Type `[[` in the editor to trigger autocomplete suggestions for existing notes and pages.

### ✨ Text Highlighting & Colour
Highlight important text directly in notes:

| Syntax | Result |
|--------|--------|
| `==critical==` | Yellow highlight (Obsidian-compatible) |
| `[c=red]warning[/c]` | Red coloured text |
| `[c=#6c63ff]purple[/c]` | Custom hex colour |

Supported colours: `red`, `orange`, `yellow`, `green`, `blue`, `purple`, `pink`, `teal`, `gray`

### 🔍 Full-Text Search
Search across all daily notes and named pages from the sidebar panel. Results show excerpts around matches with match counts. Searches page names, note dates, and content.

### 🧠 Knowledge Graph
An interactive graph (powered by Cytoscape.js) showing all your notes, pages, and their connections as nodes and edges. 

- **Filter** by name — shows matching nodes plus their direct neighbours (context)
- **Click** any node to navigate directly to the note or page

### 🗺️ Canvas
A free-form visual board where you can pin note cards, page cards, images, and URL previews. Arrange them spatially to see relationships and create visual overviews. Multiple named canvases are supported.

### 🔔 Reminders & Alerts
Add reminders and time-sensitive alerts directly in your notes using special keywords:

| Syntax | Behaviour |
|--------|-----------|
| `Remind: call the dentist` | Appears in the Reminders sidebar panel |
| `Reminder: review budget` | Same as above |
| `Alert 2025-11-01: submit report` | Appears in the Alerts panel on or after the target date |

Reminders can be dismissed individually.

### 📱 PWA (Progressive Web App)
Installable on mobile and desktop. Works offline for previously loaded notes.

### 🔒 Authentication
Simple server-side username/password authentication. No self-registration — users are configured via environment variables with bcrypt-hashed passwords.

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example and edit it:

```bash
cp .env.example .env
```

**Generate a session secret** (minimum 32 characters):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Hash your password**:

```bash
node -e "const b=require('bcryptjs'); b.hash('yourpassword', 10).then(console.log)"
```

Set your `.env`:

```env
NUXT_SESSION_PASSWORD=<your-32+-char-secret>
AUTH_USERS=[{"username":"alice","passwordHash":"$2a$10$..."}]

# Optional — defaults to ~/.quickNote
NOTES_DIR=/path/to/your/notes
```

Multiple users:

```env
AUTH_USERS=[{"username":"alice","passwordHash":"$2a$10$..."},{"username":"bob","passwordHash":"$2a$10$..."}]
```

### 3. Run in development

```bash
npm run dev
```

### 4. Build for production

```bash
npm run build
node .output/server/index.mjs
```

Or use `npm run preview` after building to test the production bundle locally.

---

## File Storage

```
~/.quickNote/
├── 2025-10-14.md       # Daily notes (one per day)
├── 2025-10-15.md
├── pages/
│   ├── Harmonica.md    # Named pages
│   └── Book List.md
└── canvas/
    └── default.json    # Canvas board state
```

All files are plain Markdown and can be edited with any text editor outside the app. The YAML frontmatter written by quickNote is standard and compatible with Obsidian, Typora, etc.

---

## Note Format Reference

### Daily Note

```markdown
Today I worked on the [[Harmonica]] page and read some articles about #music.

Remind: practice scales every morning
Alert 2025-12-01: finish year-end review
```

### Named Page with Tags

```markdown
---
tags: [music, instrument, hobby]
---

# Harmonica

Notes about playing harmonica...

Related to [[2025-10-14]] when I first picked it up.
```

### Wikilinks

| Syntax | Links to |
|--------|----------|
| `[[2025-10-14]]` | Daily note for October 14, 2025 |
| `[[Harmonica]]` | Named page "Harmonica" |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Nuxt 4](https://nuxt.com) |
| UI | [Vuetify 3](https://vuetifyjs.com) |
| Graph | [Cytoscape.js](https://js.cytoscape.org) |
| Markdown | [marked](https://marked.js.org) |
| Auth | [nuxt-auth-utils](https://github.com/atinux/nuxt-auth-utils) |
| PWA | [@vite-pwa/nuxt](https://vite-pwa-org.netlify.app/frameworks/nuxt) |
| Storage | Local filesystem (plain `.md` files) |

---

## Documentation

See the [`docs/`](./docs/) folder for detailed references:

- [Features](./docs/features.md) — detailed feature descriptions and usage
- [Setup & Deployment](./docs/setup.md) — full setup, environment variables, Docker
- [Note Format](./docs/note-format.md) — wikilinks, tags, reminders, frontmatter
- [API Reference](./docs/api.md) — all REST API endpoints
