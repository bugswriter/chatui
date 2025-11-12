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
      // ✅ Pass the fetchFn down to the service
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

  function selectSession(sessionId: string) {
    goto(`/c/${sessionId}`);
  }

  function createNewSession() {
    chatStore.reset();
    clearSelection();
    goto("/");
  }

  async function refreshSessionList(fetchFn: typeof fetch = fetch) {
    try {
      // ✅ Pass the fetchFn down to the service
      const sessions = await getSessionsList(fetchFn);
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
    setSelectedSessionId: (id: string | null, isHistory: boolean) =>
      update((s) => ({
        ...s,
        selectedSessionId: id,
        isViewingHistory: isHistory,
      })),
  };
}

export const historyStore = createHistoryStore();
