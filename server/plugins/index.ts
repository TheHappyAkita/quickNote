// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

import { registerServerPlugin } from '../utils/plugins';

// Example Server Plugin: Logging
registerServerPlugin({
  id: 'server-logger',
  hooks: {
    'server:onSave': async ({ type, name }) => {
      console.log(`[Plugin: ServerLogger] Saved ${type}: ${name}`);
    },
    'server:onDelete': async ({ type, name }) => {
      console.log(`[Plugin: ServerLogger] Deleted ${type}: ${name}`);
    }
  }
});
