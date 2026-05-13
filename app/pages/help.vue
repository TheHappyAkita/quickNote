<template>
  <div class="help-scroll">
  <v-container class="help-page py-8" style="max-width: 860px">
    <div class="d-flex align-center mb-6 gap-3">
      <v-icon size="28" color="primary">mdi-help-circle-outline</v-icon>
      <h1 class="text-h5 font-weight-bold">Notation Guide</h1>
    </div>

    <!-- LINKS & MENTIONS -->
    <v-card class="mb-4" variant="outlined">
      <v-card-title class="text-subtitle-1 font-weight-bold pb-0">
        <v-icon size="18" class="mr-2" color="primary">mdi-link-variant</v-icon>Links &amp; Mentions
      </v-card-title>
      <v-card-text>
        <v-table density="compact" class="help-table">
          <thead>
            <tr><th>Syntax</th><th>Result</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><code>[[2025-10-14]]</code></td>
              <td>📅 Link to a daily note by date</td>
            </tr>
            <tr>
              <td><code>[[Page Name]]</code></td>
              <td>📄 Link to a named page</td>
            </tr>
            <tr>
              <td><code>@[[Lastname, Forename]]</code></td>
              <td>👤 Person mention — creates a node in the graph</td>
            </tr>
            <tr>
              <td><code>&amp;[[Location Name]]</code></td>
              <td>📍 Location mention — pins the location on the map &amp; graph</td>
            </tr>
            <tr>
              <td><code>&amp;[[Name|52.52,13.405]]</code></td>
              <td>📍 Inline coord (DD) — overrides stored location coords</td>
            </tr>
            <tr>
              <td><code>&amp;[[Name|41°24'12"N 2°10'26"E]]</code></td>
              <td>📍 Inline coord (DMS) — degrees, minutes, seconds</td>
            </tr>
            <tr>
              <td><code>&amp;[[Name|POINT(-0.1278 51.5074)]]</code></td>
              <td>📍 Inline coord (WKT) — lng lat order per OGC spec</td>
            </tr>
            <tr>
              <td><code>&amp;[[52.52,13.405]]</code></td>
              <td>📍 Anonymous pin — any format, no location file needed</td>
            </tr>
            <tr>
              <td><code>[[14:30]]</code> / <code>[[14:30:45]]</code></td>
              <td>⏰ Time notation — styled text, no link</td>
            </tr>
            <tr>
              <td><code>[[2025-10-14 14:30]]</code></td>
              <td>📅 2025-10-14 ⏰ 14:30 — Datetime link</td>
            </tr>
            <tr>
              <td><code>[Google](https://google.com)</code></td>
              <td>🔗 Google — External link (opens in new tab)</td>
            </tr>
            <tr>
              <td><code>user@example.com</code></td>
              <td>📧 user@example.com — Email address (opens mail client)</td>
            </tr>
          </tbody>
        </v-table>
        <div class="text-caption text-medium-emphasis mt-2">
          Wikilinks are clickable in the preview pane and appear as nodes in the Knowledge Graph.
        </div>
      </v-card-text>
    </v-card>

    <!-- EMOJI SHORTCODES -->
    <v-card class="mb-4" variant="outlined">
      <v-card-title class="text-subtitle-1 font-weight-bold pb-0">
        <v-icon size="18" class="mr-2" color="info">mdi-emoticon-happy</v-icon>Emoji Shortcodes
      </v-card-title>
      <v-card-text>
        <v-table density="compact" class="help-table">
          <thead>
            <tr><th>Syntax</th><th>Result</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><code>:car:</code> / <code>:plane:</code> / <code>:train:</code></td>
              <td>🚗 ✈️ 🚆 — Vehicles</td>
            </tr>
            <tr>
              <td><code>:home:</code> / <code>:office:</code> / <code>:world:</code></td>
              <td>🏠 🏢 � — Places</td>
            </tr>
            <tr>
              <td><code>:sun:</code> / <code>:rain:</code> / <code>:snow:</code></td>
              <td>☀️ 🌧️ ❄️ — Weather</td>
            </tr>
            <tr>
              <td><code>:meeting:</code> / <code>:phone:</code> / <code>:email:</code></td>
              <td>👥 📞 📧 — Activities</td>
            </tr>
            <tr>
              <td><code>:coffee:</code> / <code>:pizza:</code> / <code>:beer:</code></td>
              <td>☕ 🍕 🍺 — Food & drink</td>
            </tr>
            <tr>
              <td><code>:star:</code> / <code>:heart:</code> / <code>:fire:</code></td>
              <td>⭐ ❤️ 🔥 — Misc</td>
            </tr>
          </tbody>
        </v-table>
        <div class="text-caption text-medium-emphasis mt-2">
          Use <code>:name:</code> syntax for emojis. Type a word between colons — if a match exists, it renders as an emoji.
        </div>
      </v-card-text>
    </v-card>

    <!-- TEXT FORMATTING -->
    <v-card class="mb-4" variant="outlined">
      <v-card-title class="text-subtitle-1 font-weight-bold pb-0">
        <v-icon size="18" class="mr-2" color="warning">mdi-format-color-highlight</v-icon>Text Formatting
      </v-card-title>
      <v-card-text>
        <v-table density="compact" class="help-table">
          <thead>
            <tr><th>Syntax</th><th>Result</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><code>==important text==</code></td>
              <td><mark class="hl">important text</mark> — yellow highlight</td>
            </tr>
            <tr>
              <td><code>[c=red]text[/c]</code></td>
              <td><span style="color:#ff5252">text</span> — coloured text (short form)</td>
            </tr>
            <tr>
              <td><code>[color=orange]text[/color]</code></td>
              <td><span style="color:#ff9800">text</span> — coloured text (long form)</td>
            </tr>
            <tr>
              <td><code>[c=#6c63ff]text[/c]</code></td>
              <td><span style="color:#6c63ff">text</span> — custom hex colour</td>
            </tr>
          </tbody>
        </v-table>
        <div class="text-caption text-medium-emphasis mt-2">
          Named colours: <code>red</code> · <code>orange</code> · <code>yellow</code> · <code>green</code> · <code>blue</code> · <code>purple</code> · <code>pink</code> · <code>teal</code> · <code>gray</code> · <code>white</code>
          &nbsp;— any 3- or 6-digit hex code (e.g. <code>#f00</code>) also works.
        </div>
      </v-card-text>
    </v-card>

    <!-- REMINDERS & ALERTS -->
    <v-card class="mb-4" variant="outlined">
      <v-card-title class="text-subtitle-1 font-weight-bold pb-0">
        <v-icon size="18" class="mr-2" color="warning">mdi-bell-outline</v-icon>Reminders &amp; Alerts
      </v-card-title>
      <v-card-text>
        <v-table density="compact" class="help-table">
          <thead>
            <tr><th>Syntax</th><th>Sidebar panel</th><th>Notes</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><code>Remind: call dentist</code></td>
              <td><v-icon size="14" color="warning">mdi-bell-outline</v-icon> Reminders</td>
              <td>Appears immediately</td>
            </tr>
            <tr>
              <td><code>RemindMe: submit report</code></td>
              <td><v-icon size="14" color="error">mdi-bell-ring</v-icon> Reminders</td>
              <td>Urgent style</td>
            </tr>
            <tr>
              <td><code>Reminder: follow up</code></td>
              <td><v-icon size="14" color="info">mdi-clock-alert-outline</v-icon> Reminders</td>
              <td></td>
            </tr>
            <tr>
              <td><code>Alert 2026-12-31: year-end close</code></td>
              <td><v-icon size="14" color="error">mdi-bell-alert</v-icon> Alerts</td>
              <td>Only appears on/after that date</td>
            </tr>
            <tr>
              <td><code>Todo: review PR #42</code></td>
              <td><v-icon size="14" color="grey-lighten-1">mdi-format-list-checks</v-icon> To-Do</td>
              <td>Case-insensitive; low-priority</td>
            </tr>
          </tbody>
        </v-table>
        <div class="text-caption text-medium-emphasis mt-2">
          All keywords are <strong>case-insensitive</strong>. Dismiss items with the ✓ button — they won't reappear.
          The sidebar icon shows a badge when items exist.
        </div>
      </v-card-text>
    </v-card>

    <!-- TAGS -->
    <v-card class="mb-4" variant="outlined">
      <v-card-title class="text-subtitle-1 font-weight-bold pb-0">
        <v-icon size="18" class="mr-2" color="teal">mdi-pound</v-icon>Tags
      </v-card-title>
      <v-card-text>
        <v-table density="compact" class="help-table">
          <thead>
            <tr><th>Syntax</th><th>Result</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><code>#install</code> <code>#work</code> <code>#idea</code></td>
              <td>Inline tag — creates a keyword node in the graph</td>
            </tr>
            <tr>
              <td>
                <code>---</code><br>
                <code>tags: [install, work]</code><br>
                <code>---</code>
              </td>
              <td>YAML frontmatter tags — same effect, also editable via the tag chip UI on Pages</td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>

    <!-- GRAPH -->
    <v-card class="mb-4" variant="outlined">
      <v-card-title class="text-subtitle-1 font-weight-bold pb-0">
        <v-icon size="18" class="mr-2" color="secondary">mdi-graph</v-icon>Knowledge Graph — Node types
      </v-card-title>
      <v-card-text>
        <div class="d-flex flex-wrap gap-3 mt-1">
          <v-chip color="primary" variant="tonal" size="small">
            <v-icon start size="14">mdi-calendar</v-icon>Daily note
          </v-chip>
          <v-chip color="secondary" variant="tonal" size="small">
            <v-icon start size="14">mdi-file-document-outline</v-icon>Page
          </v-chip>
          <v-chip color="pink" variant="tonal" size="small">
            <v-icon start size="14">mdi-account</v-icon>Person <code class="ml-1">@[[…]]</code>
          </v-chip>
          <v-chip color="teal" variant="tonal" size="small">
            <v-icon start size="14">mdi-map-marker</v-icon>Location <code class="ml-1">&amp;[[…]]</code>
          </v-chip>
          <v-chip color="teal" variant="tonal" size="small">
            <v-icon start size="14">mdi-pound</v-icon>Keyword / tag
          </v-chip>
        </div>
        <div class="text-caption text-medium-emphasis mt-3">
          Use the filter box on the Graph page to search for a node — matching nodes <em>and their direct neighbours</em> are highlighted.
          Click a daily note or page node to open it.
        </div>
      </v-card-text>
    </v-card>

    <!-- STANDARD MARKDOWN -->
    <v-card variant="outlined">
      <v-card-title class="text-subtitle-1 font-weight-bold pb-0">
        <v-icon size="18" class="mr-2">mdi-language-markdown</v-icon>Standard Markdown (quick ref)
      </v-card-title>
      <v-card-text>
        <v-table density="compact" class="help-table">
          <thead>
            <tr><th>Syntax</th><th>Result</th></tr>
          </thead>
          <tbody>
            <tr><td><code># Heading 1</code> … <code>### Heading 3</code></td><td>Headings</td></tr>
            <tr><td><code>**bold**</code> / <code>*italic*</code></td><td><strong>bold</strong> / <em>italic</em></td></tr>
            <tr><td><code>`inline code`</code></td><td><code>inline code</code></td></tr>
            <tr><td><code>```</code> fenced block <code>```</code></td><td>Code block with syntax highlight</td></tr>
            <tr><td><code>- item</code> / <code>1. item</code></td><td>Unordered / ordered list</td></tr>
            <tr><td><code>- [ ] task</code> / <code>- [x] done</code></td><td>Task list</td></tr>
            <tr><td><code>[label](https://…)</code></td><td>External link (opens in new tab)</td></tr>
            <tr><td><code>![alt](url)</code></td><td>Image</td></tr>
            <tr><td><code>&gt; quote</code></td><td>Blockquote</td></tr>
            <tr><td><code>---</code></td><td>Horizontal rule</td></tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>
  </v-container>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Help — quickNote' })
</script>

<style scoped>
.help-scroll {
  height: calc(100vh - var(--v-layout-top, 64px));
  overflow-y: auto;
}
.help-table {
  font-size: 0.85rem;
}
.help-table code {
  background: rgba(108, 99, 255, 0.12);
  color: #b8a5ff;
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 0.82rem;
}
mark.hl {
  background: #ffd740;
  color: #0f0f17;
  padding: 0 3px;
  border-radius: 3px;
}
</style>
