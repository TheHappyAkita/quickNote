// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

export interface ServerPluginHooks {
  'server:onSave'?: (data: { type: 'note' | 'page' | 'person' | 'location', name: string, content: string }) => Promise<void> | void;
  'server:onDelete'?: (data: { type: 'note' | 'page' | 'person' | 'location', name: string }) => Promise<void> | void;
}

export interface QuickNoteServerPlugin {
  id: string;
  hooks: ServerPluginHooks;
}

const activeServerPlugins: QuickNoteServerPlugin[] = [];

export function registerServerPlugin(plugin: QuickNoteServerPlugin) {
  if (activeServerPlugins.some(p => p.id === plugin.id)) return;
  activeServerPlugins.push(plugin);
}

export async function runServerHook<K extends keyof ServerPluginHooks>(
  hook: K,
  ...args: Parameters<NonNullable<ServerPluginHooks[K]>>
) {
  for (const plugin of activeServerPlugins) {
    const hookFn = plugin.hooks[hook] as any;
    if (hookFn) {
      try {
        await hookFn(...args);
      } catch (e) {
        console.error(`Error in server plugin ${plugin.id} hook ${hook}:`, e);
      }
    }
  }
}
