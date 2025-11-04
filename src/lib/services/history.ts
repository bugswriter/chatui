// src/lib/services/history.ts

import { API_CONFIG, getAuthToken } from "$lib/services/api";
import type { Message, Attachment } from "$lib/types";

// Describes the format for each session in the history list.
export interface SessionPreview {
  session_id: string;
  created_at: string;
  message_count: number;
  first_message_preview: string;
}

// Describes the raw message format from the history API.
interface ApiHistoryMessage {
  role: "user" | "assistant" | "system";
  content: string;
  agent_name: string | null;
  attachments: Attachment[];
}

// Describes the full data for a single historical session.
export interface SessionDetails {
  session_id: string;
  created_at: string;
  messages: ApiHistoryMessage[];
}

/**
 * Fetches the list of past chat sessions for the authenticated user.
 * @returns A promise that resolves to an array of session previews.
 */
export const getSessionsList = async (): Promise<SessionPreview[]> => {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication token not found.");

  const response = await fetch(
    `${API_CONFIG.sysAPIURL}/api/v1/history/sessions`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    console.error("Failed to fetch session list:", await response.text());
    throw new Error("Could not retrieve chat history.");
  }

  return response.json();
};

/**
 * Fetches the full details and message history for a specific session.
 * @param sessionId The ID of the session to fetch.
 * @returns A promise that resolves to the detailed session data.
 */
export const getSessionDetails = async (
  sessionId: string,
): Promise<SessionDetails> => {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication token not found.");

  const response = await fetch(
    `${API_CONFIG.sysAPIURL}/api/v1/history/sessions/${sessionId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    console.error(
      `Failed to fetch session details for ${sessionId}:`,
      await response.text(),
    );
    throw new Error("Could not load the selected chat session.");
  }

  return response.json();
};
