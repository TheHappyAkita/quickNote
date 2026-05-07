# Note Format Reference

All notes and pages are stored as plain Markdown (`.md`) files on your filesystem. They can be read and edited with any text editor or Markdown app.

---

## Daily Notes

**Filename:** `YYYY-MM-DD.md`  
**Location:** `$NOTES_DIR/` (default `~/.quickNote/`)

No special structure is required — just write Markdown.

```markdown
# 2025-10-14

Picked up the [[Harmonica]] again today. Getting better at bending notes.
Watched a useful video — will link from [[2025-10-10]] notes.

#music #practice

Remind: practice 20 minutes every morning
Alert 2025-11-01: submit the project proposal
```

---

## Named Pages

**Filename:** `<name>.md`  
**Location:** `$NOTES_DIR/pages/`

Page names support letters, numbers, spaces, hyphens, and underscores (max 100 characters).

```markdown
---
tags: [music, instrument, hobby]
---

# Harmonica

The harmonica is a free reed wind instrument...

## Resources

- [[2025-10-14]] — first practice session
- [[2025-10-20]] — bending technique
```

---

## YAML Frontmatter

Frontmatter goes at the very top of the file, between `---` delimiters. Currently supported fields:

### `tags`

Inline array:

```yaml
---
tags: [music, project, reference]
---
```

Block list:

```yaml
---
tags:
  - music
  - project
  - reference
---
```

Tags are normalized to lowercase. They are also discovered from inline `#hashtag` patterns throughout the content (see below).

---

## Inline Hashtags

Any `#word` token in the content (where `word` starts with a letter and is at least 2 characters) is treated as a tag:

```markdown
This is a page about #music and #theory.
```

Inline hashtags and frontmatter tags are merged and deduplicated. Standard Markdown headings (`# Heading`, `## Section`) are **not** treated as tags because they are followed by a space.

---

## Wikilinks

Use `[[...]]` to link to other notes or pages:

| Syntax | Destination |
|--------|-------------|
| `[[2025-10-14]]` | Daily note `2025-10-14.md` |
| `[[Harmonica]]` | Named page `pages/Harmonica.md` |

Wikilinks appear in the Knowledge Graph as edges. The editor provides autocomplete when you type `[[`.

---

## Reminders

Add reminders anywhere in the body of a **daily note**. The keyword is matched case-insensitively.

```
Remind: text
RemindMe: text
Reminder: text
```

Examples:

```markdown
Remind: call the dentist
RemindMe: review the mortgage documents
Reminder: prepare for Thursday meeting
```

Reminders appear in the **Reminders** sidebar panel. They link back to the source note. Dismissed reminders are stored in `$NOTES_DIR/.dismissed` and will not reappear.

---

## Alerts

Alerts are time-sensitive reminders that only become visible **on or after** a specified date:

```
Alert YYYY-MM-DD: text
```

Examples:

```markdown
Alert 2025-11-01: submit project proposal
Alert 2025-12-31: file end-of-year tax docs
```

- **Overdue alerts** (date is in the past) are highlighted in red
- Alerts for future dates are hidden until that date arrives
- Alerts appear in the **Alerts** sidebar panel, separate from regular reminders

---

## Text Highlighting & Colour

### Highlight

Wrap text in `==` to apply a yellow highlight (Obsidian-compatible):

```markdown
This is ==very important== and should not be missed.
```

### Coloured text

Use `[c=color]...[/c]` or the long form `[color=color]...[/color]` to colour text:

```markdown
[c=red]Critical issue[/c] — needs attention before release.
[color=green]All tests pass.[/color]
[c=#6c63ff]Custom hex colour.[/c]
```

Supported named colours: `red`, `orange`, `yellow`, `green`, `blue`, `purple`, `pink`, `teal`, `gray`

Any 3- or 6-digit hex code (e.g. `#f00`, `#ff5252`) is also accepted.

---

## Compatibility

quickNote's Markdown files are fully compatible with:

- **Obsidian** — wikilinks and YAML frontmatter work natively
- **Typora** — renders frontmatter and Markdown correctly
- **VS Code** (with Markdown Preview) — standard Markdown rendering
- **Any text editor** — plain `.md` files

The `Remind:` / `Alert:` / `Todo:` lines are just regular Markdown text when viewed in other apps.
