// src/lib/stores/uiStore.ts

import { writable } from "svelte/store";

type UIState = {
  isSidebarOpen: boolean;
};

function createUIStore() {
  const { subscribe, update } = writable<UIState>({
    isSidebarOpen: false,
  });

  return {
    subscribe,
    toggleSidebar: () =>
      update((state) => ({ ...state, isSidebarOpen: !state.isSidebarOpen })),
    closeSidebar: () => update((state) => ({ ...state, isSidebarOpen: false })),
  };
}

export const uiStore = createUIStore();
