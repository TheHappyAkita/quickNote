# quickNote

Personal knowledge base and daily note-taking app — a lightweight Obsidian-style tool.

## Features

- **Daily notes** — one markdown file per day, stored in `~/.quickNote` (or configured path)
- **Wikilinks** — use `[[YYYY-MM-DD]]` in your notes to link to other days
- **Link suggestions** — type `[[` and get autocomplete suggestions for existing notes
- **Knowledge graph** — interactive mind map of all notes and their connections
- **PWA** — works offline, installable on mobile and desktop
- **Auth** — simple server-side username/password, no registration

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

**Generate a session secret** (min 32 chars):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Generate a password hash**:
```bash
node -e "const b=require('bcryptjs');b.hash('yourpassword',10).then(console.log)"
```

Then set `AUTH_USERS`:
```
AUTH_USERS=[{"username":"yourname","passwordHash":"$2a$10$..."}]
```

**Set notes directory** (optional, defaults to `~/.quickNote`):
```
NOTES_DIR=/path/to/your/notes
```

### 3. Run development server

```bash
npm run dev
```

### 4. Build for production

```bash
npm run build
npm run preview
```

## Note format

Notes are stored as `YYYY-MM-DD.md` files in your configured notes directory.
They're plain markdown — edit them with any text editor.

### Wikilinks

Use `[[YYYY-MM-DD]]` to link to another day's note:

```markdown
Today I continued thoughts from [[2025-10-14]] about the new project.
```

In the web UI, type `[[` to trigger autocomplete suggestions.

## File storage

Notes are stored in the directory set by `NOTES_DIR` (default `~/.quickNote`).
You can edit files directly with any markdown editor — the app reads from the filesystem.
