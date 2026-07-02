// Copyright (C) 2026 TheHappyAkita
// SPDX-License-Identifier: GPL-3.0-only

export interface QuickNotePlugin {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  icon?: string;

  // Hooks
  hooks?: {
    /**
     * Called when markdown is being rendered.
     * Use this to modify the raw markdown text before it's passed to the parser
     * or to add post-processing replacements.
     */
    'markdown:render'?: (text: string) => string;

    /**
     * Register new editor suggestion triggers and providers.
     */
    'editor:suggestions'?: () => Array<{
      trigger: string | RegExp;
      mode: string;
      icon?: string;
      color?: string;
      getSuggestions: (query: string) => string[] | Promise<string[]>;
      formatInsertion: (suggestion: string) => string;
    }>;

    /**
     * Register custom components for UI slots.
     */
    'ui:sidebar'?: () => Array<{
      id: string;
      icon: string;
      title: string;
      component: any; // Vue component
    }>;

    'ui:navbar'?: () => Array<{
      id: string;
      icon: string;
      title: string;
      action: () => void;
    }>;

    /**
     * Register custom Vuetify themes.
     */
    'ui:themes'?: () => Array<{
      id: string;
      label: string;
      icon: string;
      dark: boolean;
      colors: Record<string, string>;
      cssClass?: string;
    }>;
  };

  /**
   * Lifecycle hooks
   */
  setup?: (api: QuickNoteAPI) => void | Promise<void>;
  onEnable?: () => void;
  onDisable?: () => void;
}

export interface QuickNoteAPI {
  // We will expand this as needed
  stores: {
    // pinia stores will be accessible here
  };
  utils: {
    // shared utils
  };
  storage: {
    // Plugin-specific storage access
    getItem: (key: string) => Promise<any>;
    setItem: (key: string, value: any) => Promise<void>;
  };
}
