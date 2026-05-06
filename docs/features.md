# Features

## Daily Notes

Every day gets its own Markdown file (`YYYY-MM-DD.md`). The **Today** button in the navigation bar always takes you to the current day's note.

**Saving:**
- Auto-saves when the editor loses focus
- Manual save with **Ctrl+S** (or **⌘+S** on Mac)
- Save icon turns green briefly to confirm the save

**Navigation:**
- Click the date in the header to pick any date
- Use wikilinks `[[YYYY-MM-DD]]` to jump between notes

---

## Named Pages

Pages are persistent reference documents — not tied to a date. Use them for reference material, project notes, topic overviews, etc.

**Creating a page:**
1. Go to **Pages** in the navigation
2. Type a name and click **Create** (or press Enter)
3. The editor opens immediately

**Page names** support letters, numbers, spaces, hyphens, and underscores (max 100 characters).

**Editing:** same editor as daily notes with wikilink autocomplete, Ctrl+S, and save icon.

**Deleting:** use the trash icon in the editor header (requires confirmation).

---

## Tags

Tags help you group and filter named pages.

### Adding Tags

**Option 1 — YAML frontmatter** (at the very top of the file):
```markdown
---
tags: [music, instrument, hobby]
---

# Harmonica

Your content here...
```

**Option 2 — Inline hashtags** anywhere in the content:
```markdown
This page is about #music and #theory.
```

Both sources are merged and deduplicated. Tags are normalized to lowercase.

### UI

- **Page Editor:** tags appear as chips below the page title. Click **+ Add tag** to add one inline; click **×** on a chip to remove it.
- **Pages Browser:** filter chips appear above the grid. Click a tag to filter pages. Multiple active tags require pages to have **all** selected tags (AND logic). Click **Clear filter** to reset.

---

## Wikilinks

Link between any two notes or pages using double-bracket syntax.

| Syntax | Destination |
|--------|-------------|
| `[[2025-10-14]]` | Daily note for October 14, 2025 |
| `[[Harmonica]]` | Named page titled "Harmonica" |

### Autocomplete

Type `[[` in the editor to trigger a dropdown of existing notes and pages. Continue typing to filter the list. Press **Enter** or click to insert the link.

### Graph rendering

Links become edges in the Knowledge Graph. If you link from a page to a daily note or vice versa, both sides are reflected in the graph.

---

## Full-Text Search

Access search via the **🔍 icon** in the right sidebar strip.

- Searches **all daily notes** and **all named pages**
- Matches against file names/dates **and** content
- Returns excerpts showing context around each match
- Match count badge shown for pages with multiple hits
- Click any result to navigate directly — panel closes automatically

**Minimum query length:** 2 characters. Results update as you type (300ms debounce).

---

## Knowledge Graph

The graph visualizes connections between your notes and pages.

### Node types

| Color | Shape | Meaning |
|-------|-------|---------|
| Purple (solid) | Circle | Daily note |
| Dark blue (dashed border) | Circle | Named page |
| Teal | Rounded rectangle | Keyword |

### Edges

- **Solid arrow** — wikilink (`[[...]]` reference)
- **Dashed line** — shared keyword (appears on ≥2 notes or 3+ times)

### Interactions

- **Click** a date node → navigate to that daily note
- **Click** a page node → navigate to that named page
- **Hover** → shows a tooltip label
- **Filter** → type in the header search field to filter nodes by name
- **Fit** / **Zoom** → controls in the top-right corner of the graph

---

## Canvas

A free-form spatial board for pinning and arranging content visually. Access it via **Canvas** in the navigation.

### Card types

| Type | Source |
|------|--------|
| Note card | Daily note (shows excerpt) |
| Page card | Named page (shows excerpt) |
| URL card | Web page (fetches title + description + image) |
| Image card | Uploaded or linked image |

### Multiple canvases

Create, rename, and delete named canvases using the toolbar at the top of the canvas view. Each canvas is saved independently.

### Interactions

- Drag cards to rearrange them
- Click a note/page card to open its editor
- Connect cards by drawing edges between them

---

## Reminders & Alerts

Add structured reminders and timed alerts directly in the body of any **daily note**.

### Reminders

Use any of these keywords at the start of a line (case-insensitive):

```
Remind: text
RemindMe: text
Reminder: text
```

Reminders appear in the **🔔 Reminders** sidebar panel for every note they are found in. They remain visible until dismissed.

### Alerts

```
Alert YYYY-MM-DD: text
```

Alerts only appear in the **🔴 Alerts** panel **on or after** the specified date. They are ordered by urgency and shown with the date and source note.

### Dismissing

Click the **✓ checkmark** on any reminder or alert to dismiss it. Dismissed items are remembered and will not reappear.

---

## PWA (Offline Support)

quickNote is installable as a Progressive Web App on any device.

- **Install prompt** appears automatically on supported browsers
- **Offline access** — previously viewed pages are cached and readable without a network connection
- **API caching** — note data is cached with a 7-day expiration (Network-First strategy)
