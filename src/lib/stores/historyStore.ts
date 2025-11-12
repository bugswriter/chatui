// src/lib/stores/historyStore.ts

import { writable } from "svelte/store";
import { getSessionsList } from "$lib/services/history";
import { chatStore } from "./chatStore";
import { goto } from "$app/navigation";

type HistoryState = {
  sessions: {
    session_id: string;
    created_at: string;
    message_count: number;
    first_message_preview: string;
  }[];
  selectedSessionId: string | null;
  isLoading: boolean;
  error: string | null;
  isViewingHistory: boolean;
};

function createHistoryStore() {
  const { subscribe, set, update } = writable<HistoryState>({
    sessions: [],
    selectedSessionId: null,
    isLoading: false,
    error: null,
    isViewingHistory: false,
  });

  async function loadSessions(fetchFn: typeof fetch = fetch) {
    update((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const sessions = await getSessionsList(fetchFn);
      set({
        sessions,
        selectedSessionId: null,
        isLoading: false,
        error: null,
        isViewingHistory: false,
      });
    } catch (e) {
      const errorMsg =
        e instanceof Error ? e.message : "Failed to load history.";
      update((s) => ({ ...s, isLoading: false, error: errorMsg }));
    }
  }

  // When a user clicks a session in the history list, we navigate them to the read-only view.
  function selectSession(sessionId: string) {
    goto(`/c/${sessionId}`);
  }

  // When a user wants to start a new chat (from history or elsewhere).
  function createNewSession() {
    // 1. Reset the chat store completely (clears messages, session ID, etc.).
    chatStore.reset();
    // 2. Clear this store's own selection state.
    clearSelection();
    // 3. Navigate to the homepage, which is the dedicated page for starting new live chats.
    goto("/");
  }

  async function refreshSessionList() {
    try {
      const sessions = await getSessionsList();
      update((s) => ({ ...s, sessions }));
    } catch (e) {
      console.error("Failed to refresh session list:", e);
    }
  }

  function clearSelection() {
    update((s) => ({ ...s, selectedSessionId: null, isViewingHistory: false }));
  }

  function reset() {
    set({
      sessions: [],
      selectedSessionId: null,
      isLoading: false,
      error: null,
      isViewingHistory: false,
    });
  }

  return {
    subscribe,
    loadSessions,
    selectSession,
    createNewSession,
    refreshSessionList,
    reset,
    clearSelection,
    // This is called by the page components to keep the UI in sync with the URL.
    setSelectedSessionId: (id: string | null, isHistory: boolean) =>
      update((s) => ({
        ...s,
        selectedSessionId: id,
        isViewingHistory: isHistory,
      })),
  };
}

export const historyStore = createHistoryStore();
