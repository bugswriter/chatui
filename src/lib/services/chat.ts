// src/lib/services/chat.ts

import { API_CONFIG, getAuthToken } from '$lib/services/api';
import { authStore } from '$lib/stores/authStore'; // ✅ IMPORT the authStore
import type { Attachment, StreamEvent } from '$lib/types';

interface ChatRequestPayload {
	message: string;
	session_id: string | null;
	attachments: Array<{
		file_id: string;
		s3_key: string;
		filename: string;
		content_type?: string;
	}>;
}

/**
 * Initiates a streaming chat connection to the backend.
 */
export const streamChat = async (
	message: string,
	sessionId: string | null,
	attachments: Attachment[],
	onEvent: (event: StreamEvent) => void,
	onError: (error: string) => void
): Promise<void> => {
	const token = getAuthToken();
	if (!token) {
		onError('Authentication token not found. Please log in.');
		return;
	}

	const requestBody: ChatRequestPayload = {
		message,
		session_id: sessionId,
		attachments: attachments.map((att) => ({
			file_id: att.file_id,
			s3_key: att.s3_key,
			filename: att.filename,
			content_type: att.content_type
		}))
	};

	try {
		const response = await fetch(`${API_CONFIG.apiBaseUrl}/api/v1/chat`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(requestBody)
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Failed to start chat stream: ${response.status} ${errorText}`);
		}

		const reader = response.body?.getReader();
		if (!reader) {
			throw new Error('Could not read response body from the server.');
		}

		const decoder = new TextDecoder();
		let buffer = '';

		while (true) {
			const { done, value } = await reader.read();
			if (done) {
				break; // Exit the loop when the stream is finished
			}

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split('\n');
			buffer = lines.pop() || '';

			for (const line of lines) {
				if (line.trim()) {
					try {
						const event = JSON.parse(line) as StreamEvent;
						if (event.type === 'error') {
							onError(event.error || 'An unknown stream error occurred.');
						} else {
							onEvent(event);
						}
					} catch (e) {
						console.error('Failed to parse a stream event:', line, e);
					}
				}
			}
		}

		// --- ✅ NEW: Refresh user details after a successful stream ---
		// This is the perfect time to update the coin balance.
		console.log('Chat stream finished successfully. Refreshing user details...');
		authStore.refreshUserDetails();
	} catch (error) {
		console.error('Chat stream error:', error);
		onError(error instanceof Error ? error.message : 'A network error occurred.');
	}
};