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

// ✅ ADD THIS NEW INTERFACE
export interface SessionState {
  session_id: string;
  user_id: string;
  mode: "router" | "worker";
  agent_name: string | null;
}

export interface StreamEvent {
  type:
    | "session_id" // This event is now deprecated but harmless to keep for old versions
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
