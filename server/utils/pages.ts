// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import type { NotePageMeta } from '#shared/types/notes'
import { createContentNamespace, type ContentNamespace } from './content-namespace'
import { MAX_PAGE_NAME_LENGTH } from './constants'

const PAGE_NAME_PATTERN = /^[a-zA-Z0-9_\-\. äöüÄÖÜáéíóúàèìòùâêîôûãõ_]+$/

export function isValidPageName(name: string): boolean {
  return PAGE_NAME_PATTERN.test(name) && name.length > 0 && name.length <= MAX_PAGE_NAME_LENGTH
}

const pagesNamespace: ContentNamespace<NotePageMeta> = createContentNamespace({
  dirName: 'pages',
  type: 'page',
  maxNameLength: MAX_PAGE_NAME_LENGTH,
  namePattern: PAGE_NAME_PATTERN,
})

export const {
  list: listPages,
  read: readPage,
  write: writePage,
  delete: deletePage,
  listWithMeta: listPagesWithMeta,
  rename: renamePageFile,
} = pagesNamespace
