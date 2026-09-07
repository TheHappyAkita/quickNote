# quickNote

A lightweight, self-hosted personal knowledge base and daily note-taking app — inspired by Obsidian, built with Nuxt 4.

> **Your notes are plain Markdown files on your filesystem.** No database and no lock-in.

---

## Features

### Daily Notes

Every day can have one Markdown file named `YYYY-MM-DD.md`. Navigate through:

- **Today** — jump to today's note
- **Calendar** — choose a date
- **Previous/Next** — move through existing notes chronologically
- **Wikilinks** — use `[[YYYY-MM-DD]]` to move between daily notes

Notes auto-save when the editor loses focus. Save explicitly with **Ctrl+S** (or **Cmd+S** on macOS) or the save button.

### Named Pages

Create persistent reference documents for topics such as projects, books, or hobbies. Pages are stored in `pages/` and support Markdown, tags, wikilinks, search, graph relationships, and the same editor used for daily notes.

### People

Mention people with `@[[Lastname, Forename]]`. Person files are stored in `people/` and can contain contact information, biography details, or meeting notes. Mentions are shown in the Knowledge Graph and can be used as Library sources.

### Locations and Map

Document places with `&[[Name]]` or coordinate-based mentions:

- **Named locations:** stored in `locations/`
- **Coordinate pins:** use `&[[lat,lng]]` without creating a named location first
- **Inline coordinates:** use `&[[Name|coordinates]]` to override stored coordinates
- **Nicknames:** use `&[[Name]](Nickname)` for an inline display name
- **Coordinate formats:** decimal degrees (DD), degrees/minutes/seconds (DMS), degrees/decimal minutes (DDM), and WKT `POINT(lng lat)`
- **Map view:** see stored locations and mentioned coordinates together

### Meetings

Meetings have their own Markdown namespace under `meetings/`. Create, search, tag, edit, and delete meeting notes separately from daily notes. Meeting metadata is stored as standard YAML frontmatter:

```markdown
---
date: 2026-08-21 10:00
timezone: Europe/Berlin
topic: Sprint Review
attendees: [@[[Doe, Jane]], @[[Smith, Alex]]]
---

# Sprint Review

Agenda and outcomes...
```

A meeting can be linked with `[[Meeting Name]]` once the meeting exists. Attendees can be selected from existing people or entered as person mentions.

### Library and AI-Assisted Summaries

The Library stores longer, generated or manually edited knowledge documents in `library/`. The three-step Library Creator can combine:

- Daily notes
- Named pages
- People
- Locations
- Existing Library entries
- External URLs
- Additional text

Content is generated through a local [Ollama](https://ollama.com) instance, then saved as a normal Markdown file. Configure the Ollama URL and model in **Settings**. Library entries can also be edited directly in quickNote or with any text editor.

### Tags

Organize content with YAML frontmatter tags or inline hashtags:

```markdown
---
tags: [music, project, hobby]
---

This page also covers #practice and #theory.
```

Frontmatter and inline tags are merged, deduplicated, and normalized to lowercase. Tag filters are available in the entity browsers.

### Links and Mentions

quickNote supports standard Markdown links as well as application-specific wikilinks. See [Linking documents](#linking-documents) for the complete syntax and guidance for editing files with other applications.

### Text Highlighting and Colour

```markdown
==Important text==
[c=red]Warning[/c]
[color=green]Completed[/color]
[c=#6c63ff]Custom colour[/c]
```

Named colours include `red`, `orange`, `yellow`, `green`, `blue`, `purple`, `pink`, `teal`, and `gray`. Three- and six-digit hexadecimal colours are also supported.

### Full-Text Search

Search daily notes, pages, locations, Library entries, and meetings from the sidebar. Searches match names and file contents, show excerpts around matches, and sort results by match count. Queries must contain at least two characters.

### Knowledge Graph

The interactive [Cytoscape.js](https://js.cytoscape.org) graph shows relationships between:

- Daily notes, pages, Library entries, and meetings
- Person and location mentions
- Keywords and tags
- Wikilink edges between supported documents

Filter by node name to show matches and their direct neighbours. Click a node to open its associated view.

### Canvas

Canvas is a free-form visual board for arranging note and page cards, images, URL previews, and connections. Multiple named canvases are supported; their state is stored separately from Markdown content.

### Reminders, Alerts, and To-Dos

Add these keywords to the body of a note or other supported content file:

| Syntax | Behaviour |
| --- | --- |
| `Remind: text` | Shows an active reminder |
| `RemindMe: text` | Shows an active reminder with urgent styling |
| `Reminder: text` | Shows an active reminder |
| `Alert 2026-11-01: text` | Shows the alert on or after the specified date |
| `Todo: text` | Shows a to-do item |

Keywords are case-insensitive. Items can be dismissed from the sidebar. Dismissed reminder state is stored separately from Markdown content.

### Plugin System

Plugins are discovered from the `plugins/` directory inside `NOTES_DIR` (default: `~/.quickNote/plugins`). Plugins can provide:

- Custom themes
- Markdown rendering hooks
- Editor suggestion providers
- Navbar and sidebar UI items
- Server-side save and delete hooks

### Progressive Web App

Install quickNote as a PWA on supported mobile and desktop browsers. Previously loaded content remains available offline according to the service worker cache policy.

### Authentication and Themes

Authentication uses server-side sessions with users configured through `AUTH_USERS`; there is no self-registration. The application includes dark, sepia, and hacker-green themes.

---

## Quick Start

### Requirements

- Node.js 20 or later
- npm 9 or later

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the environment

Copy the example file and edit the values:

```bash
cp .env.example .env
```

Generate a session secret of at least 32 characters:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Hash a password with bcrypt:

```bash
node -e "const b=require('bcryptjs'); b.hash('yourpassword', 10).then(console.log)"
```

Set the resulting values in `.env`:

```env
NUXT_SESSION_PASSWORD=<your-32+-character-secret>
AUTH_USERS='[{"username":"alice","passwordHash":"$2a$10$..."}]'

# Optional — defaults to ~/.quickNote
NOTES_DIR=~/.quickNote

# Optional — local Ollama endpoint used by Library generation
NUXT_OLLAMA_BASE_URL=http://localhost:11434
```

### 3. Run in development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Build for production

```bash
npm run build
node .output/server/index.mjs
```

Use `npm run preview` after building to test the production bundle locally.

For Docker, Docker Compose, reverse proxy, and upgrade instructions, see [Setup & Deployment](./docs/setup.md).

---

## File Storage

By default, quickNote stores content in `~/.quickNote`. Set `NOTES_DIR` to use another directory.

```text
~/.quickNote/
├── 2026-08-24.md             # Daily notes
├── pages/                    # Named pages
│   └── Harmonica.md
├── people/                   # Person files
│   └── Doe, Jane.md
├── locations/                # Named and coordinate-based locations
│   └── Central Park.md
├── meetings/                 # Meeting notes
│   └── Sprint Review.md
├── library/                  # Library entries
│   └── Project Summary.md
├── canvas/                   # Canvas metadata and board state (JSON)
├── plugins/                  # Optional plugin definitions (JSON)
├── settings.json             # Application settings, including Ollama
└── .dismissed_reminders.json # Dismissed reminder keys
```

Markdown namespaces contain ordinary UTF-8 `.md` files. Canvas state, application settings, plugin definitions, and dismissed-reminder state are JSON or metadata files rather than note content.

---

## Linking Documents

quickNote keeps link syntax in the source Markdown and turns it into clickable links in the preview. Links are not database IDs: they are readable text that can be stored in Git, synced, backed up, or edited by another application.

### Link syntax

| Syntax | Destination or behaviour |
| --- | --- |
| `[[2026-08-24]]` | Daily note `2026-08-24.md` |
| `[[2026-08-24 14:30]]` | Date/time link to the daily-note route |
| `[[14:30]]` or `[[14:30:45]]` | Styled time notation; not a document link |
| `[[Project Ideas]]` | Named Page `pages/Project Ideas.md` |
| `[[Sprint Review]]` | Meeting `meetings/Sprint Review.md` when that meeting exists |
| `@[[Doe, Jane]]` | Person `people/Doe, Jane.md` |
| `&[[Central Park]]` | Named location `locations/Central Park.md` |
| `&[[40.7829,-73.9654]]` | Coordinate-based location pin |
| `&[[Central Park|40.7829,-73.9654]]` | Named location with inline coordinates |
| `&[[Central Park]](Office)` | Named location with an inline nickname |
| `[project site](https://example.com)` | Standard external Markdown link, opened in a new tab |
| `[local document](file:///home/alice/document.pdf)` | Local file link; browser permissions may be required |
| `alice@example.com` | Email link opened by the mail client |

Use the exact display name inside a wikilink. Names are case-sensitive when quickNote matches an existing entity. A missing `[[Name]]` is rendered as a Page link, while `@[[Name]]` and `&[[Name]]` are rendered as person and location links even if the target file has not been created yet.

### Editing links with other applications

Because the source is plain text, another application can edit any `.md` file directly:

1. Open the directory configured by `NOTES_DIR`.
2. Edit the relevant file in VS Code, Vim, Obsidian, Typora, or another Markdown editor.
3. Save it as UTF-8 Markdown without converting or removing the quickNote syntax.
4. Return to quickNote and reload the relevant list or page so it reads the updated file.

To preserve navigation and graph relationships, keep these parts intact when an external tool formats or rewrites a file:

- `[[...]]` wikilinks, including the brackets and exact target name
- `@[[...]]` person mentions
- `&[[...]]` location mentions, coordinate values, and optional `(Nickname)` labels
- Standard Markdown links such as `[label](https://...)` and `[label](file:...)`
- YAML frontmatter delimiters (`---`) and fields such as `name`, `tags`, `date`, `timezone`, `topic`, `attendees`, `lat`, `lng`, and `nickname`

External editing does not require an import or export step. quickNote writes changes back to the same files and does not add a proprietary format. It does not run a filesystem watcher, so changes made outside the app may require a browser refresh or revisiting the relevant view before they appear.

Other Markdown applications will render standard Markdown normally. They may display `[[...]]`, `@[[...]]`, `&[[...]]`, and reminder keywords as plain text unless they support those conventions, but the source remains usable and the syntax is preserved for quickNote.

> **Tip:** Avoid renaming a Markdown file in another application unless you also update wikilinks that point to it. For entities with a display `name:` in frontmatter, keep that field consistent with the names used in links.

---

## Note Format Examples

### Daily note

```markdown
Today I worked on [[Harmonica]] and met @[[Doe, Jane]] at &[[Central Park]].

Read the [project brief](https://example.com/brief).

#music #practice
Remind: practice scales every morning
Alert 2026-12-01: finish year-end review
```

### Named page with tags

```markdown
---
tags: [music, instrument, hobby]
---

# Harmonica

Notes about playing harmonica...

Related to [[2026-08-24]] when I first picked it up.
```

### Location with metadata

```markdown
---
name: Central Park
lat: 40.7829
lng: -73.9654
nickname: Favourite spot
tags: [outdoors]
---

A place to visit.
```

---

## Development

```bash
npm run dev
npm test
npm run typecheck
npm run build
```

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | [Nuxt 4](https://nuxt.com) |
| UI | [Vuetify 3](https://vuetifyjs.com) |
| Graph | [Cytoscape.js](https://js.cytoscape.org) |
| Maps | [Leaflet](https://leafletjs.com) |
| Markdown | [marked](https://marked.js.org) |
| Auth | [nuxt-auth-utils](https://github.com/atinux/nuxt-auth-utils) |
| PWA | [@vite-pwa/nuxt](https://vite-pwa-org.netlify.app/frameworks/nuxt) |
| Storage | Local filesystem (plain `.md` and JSON files) |
| AI summaries | Local [Ollama](https://ollama.com), optional |

---

## Documentation

See the [`docs/`](./docs/) folder for detailed references:

- [Features](./docs/features.md) — detailed feature descriptions and usage
- [Setup & Deployment](./docs/setup.md) — full setup, environment variables, Docker
- [Note Format](./docs/note-format.md) — wikilinks, tags, reminders, frontmatter
- [API Reference](./docs/api.md) — REST API endpoints

---

## License

quickNote is licensed under the [GNU General Public License v3.0](https://www.gnu.org/licenses/gpl-3.0.html).
