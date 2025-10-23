// src/lib/types.ts

export interface Attachment {
	file_id: string;
	s3_key: string;
	filename: string;
	url?: string;
	content_type?: string;
	size?: number;
}

// ✅ MODIFIED: Expanded the Agent interface to include all fields from the API.
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
	role: 'user' | 'assistant';
	content: string;
	attachments?: Attachment[];
	timestamp: Date;
	agent?: Partial<Agent> | null; // Can be partial as message events might not have all details
	isPending?: boolean;
}

export interface ProgressInfo {
	agent_name: string;
	message: string;
	progress: number;
	total: number;
}

export interface StreamEvent {
	type:
		| 'session_id'
		| 'user_message_receipt'
		| 'stream_start' // Added
		| 'assistant_message_start'
		| 'content_chunk'
		| 'assistant_attachment'
		| 'progress'
		| 'stream_end' // Added
		| 'error';
	session_id?: string;
	message?: any;
	message_id?: string;
	chunk?: string;
	attachments?: Attachment[];
	agent_name?: string;
	progress?: number;
	total?: number;
	error?: string;
	status?: 'success' | 'error'; // For stream_end
}
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
}

export interface Message {
	id: string;
	role: 'user' | 'assistant';
	content: string;
	attachments?: Attachment[];
	timestamp: Date;
	agent?: Agent | null;
	isPending?: boolean; // ✅ ADDED: To track optimistic UI updates
}

export interface ProgressInfo {
	agent_name: string;
	message: string;
	progress: number;
	total: number;
}

export interface StreamEvent {
	type:
		| 'session_id'
		| 'user_message_receipt'
		| 'assistant_message_start'
		| 'content_chunk'
		| 'assistant_attachment'
		| 'progress'
		| 'error';
	session_id?: string;
	message?: any;
	message_id?: string;
	chunk?: string;
	attachments?: Attachment[];
	agent_name?: string;
	progress?: number;
	total?: number;
	error?: string;
}