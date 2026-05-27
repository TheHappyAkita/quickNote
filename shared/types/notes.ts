// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

export interface NotePageMeta {
  name: string   // display name (from frontmatter name: or slug)
  slug: string   // filesystem-safe filename without extension
  tags: string[]
}

export interface PersonMeta {
  name: string   // display name (from frontmatter name: or slug)
  slug: string   // filesystem-safe filename without extension
  tags: string[]
}

export interface LocationMeta {
  name: string      // display name (from frontmatter name: or slug)
  slug: string      // filesystem-safe filename without extension
  tags: string[]
  lat?: number
  lng?: number
  nickname?: string
  mentionedInDates?: string[]   // YYYY-MM-DD dates where this location is mentioned
  mentionedInPages?: string[]   // page names where this location is mentioned
  mentionedInPeople?: string[]  // person names where this location is mentioned
}

export interface GraphNode {
  data: { id: string; label: string; type: 'date' | 'page' | 'keyword' | 'person' | 'location'; weight?: number }
}

export interface GraphEdge {
  data: { id: string; source: string; target: string; type: 'wikilink' | 'keyword' }
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export type CanvasCard =
  | { id: string; type: 'note'; date: string; x: number; y: number }
  | { id: string; type: 'page'; pageName: string; x: number; y: number }
  | { id: string; type: 'url'; url: string; title: string; description: string; image: string; x: number; y: number }
  | { id: string; type: 'image'; src: string; x: number; y: number }

export interface CanvasEdge {
  id: string
  source: string
  target: string
}

export interface CanvasState {
  cards: CanvasCard[]
  edges: CanvasEdge[]
}

export interface CanvasMeta {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface Reminder {
  date: string
  text: string
  keyword: 'remind' | 'remindme' | 'reminder' | 'alert' | 'todo'
  alertDate?: string // For alert-type reminders: the target date
}
