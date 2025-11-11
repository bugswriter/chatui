// src/lib/stores/chatStore.ts

import { writable } from "svelte/store";
import type {
  Message,
  ProgressInfo,
  StreamEvent,
  Attachment,
  Agent,
} from "$lib/types";

function createChatStore() {
  const store = writable<{
    messages: Message[];
    activeStreams: Set<string>;
    isLoading: boolean;
    sessionId: string | null;
    activeAgent: Partial<Agent> | null;
  }>({
    messages: [],
    activeStreams: new Set(),
    isLoading: false,
    sessionId: null,
    activeAgent: null,
  });

  const { subscribe, set, update } = store;

  const handleStreamEvent = (event: StreamEvent) => {
    update((state) => {
      switch (event.type) {
        case "user_message_receipt":
          const messagesWithReceipt = state.messages.map((m) => {
            if (m.clientId === event.message?.id) {
              return { ...m, id: event.message.id };
            }
            if (m.id.startsWith("client_") && event.message) {
              return { ...m, id: event.message.id };
            }
            return m;
          });
          return { ...state, messages: messagesWithReceipt };

        case "stream_start":
          const newActiveStreams = new Set(state.activeStreams);
          newActiveStreams.add(event.message_id!);
          // Set isLoading to false here, as the stream has officially started
          return {
            ...state,
            activeStreams: newActiveStreams,
            isLoading: false,
          };

        case "assistant_message_start":
          if (
            event.message?.id &&
            !state.messages.some((m) => m.id === event.message.id)
          ) {
            const updatedMessages = [...state.messages];
            const newAgent = event.message.agent;

            if (
              state.activeAgent &&
              newAgent &&
              state.activeAgent.id !== newAgent.id
            ) {
              const systemMessage: Message = {
                id: `system_${event.message.id}`,
                role: "system",
                content: `${state.activeAgent.name} has left. ${newAgent.name} has joined.`,
                timestamp: new Date(),
              };
              updatedMessages.push(systemMessage);
            }

            const newMessage: Message = {
              id: event.message.id,
              role: "assistant",
              agent: newAgent,
              content: "",
              attachments: event.message.attachments || [],
              timestamp: new Date(),
              progress: null,
            };
            updatedMessages.push(newMessage);

            return {
              ...state,
              messages: updatedMessages,
              activeAgent: newAgent || state.activeAgent,
            };
          }
          return state;

        case "content_chunk":
          const messagesWithChunk = state.messages.map((m) => {
            if (m.id === event.message_id) {
              return {
                ...m,
                content: m.content + (event.chunk || ""),
                progress: null,
              };
            }
            return m;
          });
          return { ...state, messages: messagesWithChunk };

        case "assistant_attachment":
          const messagesWithAttachment = state.messages.map((m) => {
            if (m.id === event.message_id) {
              const existingAttachments = m.attachments || [];
              const newAttachments = event.attachments || [];
              return {
                ...m,
                attachments: [...existingAttachments, ...newAttachments],
              };
            }
            return m;
          });
          return { ...state, messages: messagesWithAttachment };

        case "progress":
          const messagesWithProgress = state.messages.map((m) => {
            if (m.id === event.message_id) {
              const progressInfo: ProgressInfo = {
                agent_name: event.agent_name || m.agent?.name || "Agent",
                message: event.message || "Working...",
                progress: event.progress ?? 0,
                total: event.total ?? 0,
              };
              return { ...m, progress: progressInfo };
            }
            return m;
          });
          return { ...state, messages: messagesWithProgress };

        case "stream_end":
          const finishedStreams = new Set(state.activeStreams);
          finishedStreams.delete(event.message_id!);

          const finalMessages = state.messages.map((m) => {
            if (m.id === event.message_id) {
              return { ...m, progress: null };
            }
            return m;
          });
          return {
            ...state,
            messages: finalMessages,
            activeStreams: finishedStreams,
          };

        case "error":
          console.error("Stream Error Event:", event.error);
          return {
            ...state,
            isLoading: false,
            activeStreams: new Set(),
          };
      }
      return state;
    });
  };

  const sendMessage = (content: string, attachments: Attachment[]) => {
    const clientSideId = `client_${crypto.randomUUID()}`;
    const userMessage: Message = {
      id: clientSideId,
      clientId: clientSideId,
      role: "user",
      content: content,
      attachments: attachments,
      timestamp: new Date(),
    };

    update((state) => ({
      ...state,
      messages: [...state.messages, userMessage],
      isLoading: true,
    }));
  };

  const handleStreamFailure = (error: string) => {
    console.error("Fatal stream error:", error);
    update((state) => ({
      ...state,
      isLoading: false,
      activeStreams: new Set(),
    }));
  };

  const loadFromHistory = (payload: {
    messages: Message[];
    sessionId: string;
    activeAgent: Partial<Agent> | null;
  }) => {
    set({
      messages: payload.messages,
      sessionId: payload.sessionId,
      activeAgent: payload.activeAgent,
      isLoading: false,
      activeStreams: new Set(),
    });
  };

  const setLoadingState = () => {
    update((state) => ({
      ...state,
      messages: [],
      isLoading: true,
      activeStreams: new Set(),
      activeAgent: null,
    }));
  };

  const reset = (sessionId: string | null = null) => {
    set({
      messages: [],
      activeStreams: new Set(),
      isLoading: false,
      sessionId: sessionId,
      activeAgent: null,
    });
  };

  // ✅ This is the simple helper function that the ChatPage now uses.
  const setSessionId = (id: string) => {
    update((s) => ({ ...s, sessionId: id }));
  };

  return {
    subscribe,
    sendMessage,
    handleStreamEvent,
    handleStreamFailure,
    loadFromHistory,
    setLoadingState,
    reset,
    setSessionId, // ✅ Expose the new helper.
  };
}

export const chatStore = createChatStore();
