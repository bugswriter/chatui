// src/lib/types.ts

export interface Attachment {
  file_id: string;
  s3_key: string;
  filename: string;
  url?: string;
  content_type?: string;
  size?: number;
}

export interface Agent {
  id: number;
  name: string;
  avatar: string;
  role: string;
  description: string;
  mcp_server_url: string;
}

export interface Message {
  id: string;
  // ✅ FIX: Add a stable `clientId` that never changes, solving the re-render key issue.
  clientId?: string;
  role: "user" | "assistant" | "system";
  content: string;
  attachments?: Attachment[];
  timestamp: Date;
  agent?: Partial<Agent> | null;
  isPending?: boolean;
  progress?: ProgressInfo | null;
}

export interface ProgressInfo {
  agent_name: string;
  message: string;
  progress: number;
  total: number;
}

export interface StreamEvent {
  type:
    | "session_id"
    | "user_message_receipt"
    | "stream_start"
    | "assistant_message_start"
    | "content_chunk"
    | "assistant_attachment"
    | "progress"
    | "stream_end"
    | "error";
  session_id?: string;
  message?: any;
  message_id?: string;
  chunk?: string;
  attachments?: Attachment[];
  agent_name?: string;
  progress?: number;
  total?: number;
  error?: string;
  status?: "success" | "error";
}
