// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import type { PersonMeta } from '#shared/types/notes'
import { createContentNamespace, type ContentNamespace } from './content-namespace'
import { MAX_PERSON_NAME_LENGTH } from './constants'

const PERSON_NAME_PATTERN = /^[a-zA-Z0-9\. _\-äöüÄÖÜáéíóúàèìòùâêîôûãõ_]+$/

export function isValidPersonName(name: string): boolean {
  return PERSON_NAME_PATTERN.test(name) && name.length > 0 && name.length <= MAX_PERSON_NAME_LENGTH
}

const personsNamespace: ContentNamespace<PersonMeta> = createContentNamespace({
  dirName: 'people',
  type: 'person',
  maxNameLength: MAX_PERSON_NAME_LENGTH,
  namePattern: PERSON_NAME_PATTERN,
})

export const {
  list: listPersons,
  read: readPerson,
  write: writePerson,
  delete: deletePerson,
  listWithMeta: listPersonsWithMeta,
  rename: renamePersonFile,
} = personsNamespace
