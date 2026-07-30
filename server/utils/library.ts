// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import type { LibraryMeta } from '#shared/types/notes'
import { 
  createContentNamespace,
  type ContentNamespace 
} from './content-namespace'

const libraryNamespace: ContentNamespace<LibraryMeta> = createContentNamespace({
  dirName: 'library',
  type: 'library',
  maxNameLength: 100,
})

export const {
  list: listLibrary,
  read: readLibrary,
  write: writeLibrary,
  delete: deleteLibrary,
  listWithMeta: listLibraryWithMeta,
  rename: renameLibraryFile,
} = libraryNamespace
