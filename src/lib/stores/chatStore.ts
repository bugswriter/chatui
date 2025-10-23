// src/lib/stores/chatStore.ts

import { writable } from 'svelte/store';
import type { Message, ProgressInfo, StreamEvent, Attachment } from '$lib/types';

function createChatStore() {
	const { subscribe, set, update } = writable<{
		messages: Message[];
		// REPLACED streamingMessageId with a more robust system
		activeStreams: Set<string>;
		progress: ProgressInfo | null;
		isLoading: boolean; // True when waiting for the first response chunk
		sessionId: string | null;
	}>({
		messages: [],
		activeStreams: new Set(),
		progress: null,
		isLoading: false,
		sessionId: null,
	});

	const handleStreamEvent = (event: StreamEvent) => {
		update(state => {
			switch (event.type) {
				case 'session_id':
					return { ...state, sessionId: event.session_id || state.sessionId };

				case 'user_message_receipt':
					// Find the optimistic message and replace it with the confirmed one from the backend.
					// This preserves the chat order and gives us the permanent ID.
					const messagesWithReceipt = [...state.messages];
					const optimisticIndex = messagesWithReceipt.findIndex(m => m.id.startsWith('client_'));
					if (optimisticIndex !== -1 && event.message) {
						messagesWithReceipt[optimisticIndex] = {
							...event.message,
							timestamp: new Date() // Use client time for consistency
						};
					}
					return { ...state, messages: messagesWithReceipt };

				// --- NEW LIFECYCLE MANAGEMENT ---
				case 'stream_start':
					state.activeStreams.add(event.message_id!);
					// No need to set isLoading here; sendMessage already did.
					// Clear progress from any previous turn.
					return { ...state, progress: null };

				case 'assistant_message_start':
					if (event.message?.id && !state.messages.some(m => m.id === event.message.id)) {
						const newMessage: Message = {
							...event.message,
							content: '', // Start with empty content
							timestamp: new Date()
						};
						return {
							...state,
							isLoading: false, // The placeholder is now visible, so the main loader can go.
							messages: [...state.messages, newMessage],
						};
					}
					return state;

				case 'content_chunk':
					const messagesWithChunk = state.messages.map(m => {
						if (m.id === event.message_id) {
							// Ensure the "typing..." indicator is removed on the first chunk.
							const newContent = m.isPending ? event.chunk || '' : m.content + (event.chunk || '');
							return { ...m, content: newContent, isPending: false };
						}
						return m;
					});
					return { ...state, messages: messagesWithChunk };
				
				case 'assistant_attachment':
					const messagesWithAttachment = state.messages.map(m => {
						if (m.id === event.message_id) {
							const existingAttachments = m.attachments || [];
							const newAttachments = event.attachments || [];
							return { ...m, attachments: [...existingAttachments, ...newAttachments] };
						}
						return m;
					});
					return { ...state, messages: messagesWithAttachment };
				
				case 'progress':
					// Progress is a self-contained event.
					return { ...state, progress: event as ProgressInfo };

				// --- NEW LIFECYCLE MANAGEMENT ---
				case 'stream_end':
					state.activeStreams.delete(event.message_id!);
					// If this was the last active stream, the turn is officially over.
					if (state.activeStreams.size === 0) {
						return { ...state, progress: null };
					}
					return state; // Otherwise, just update the set.
				
				case 'error':
					console.error("Stream Error Event:", event.error);
					// On any error, kill all loading states.
					return {
						...state,
						isLoading: false,
						activeStreams: new Set(),
						progress: null,
					};
			}
			return state;
		});
	};

	const sendMessage = (content: string, attachments: Attachment[]) => {
		// 1. Create an optimistic message with a temporary client-side ID.
		const clientSideId = `client_${crypto.randomUUID()}`;
		const userMessage: Message = {
			id: clientSideId,
			role: 'user',
			content: content,
			attachments: attachments,
			timestamp: new Date(),
		};

		// 2. Update the UI immediately.
		update(state => ({
			...state,
			messages: [...state.messages, userMessage],
			isLoading: true, // Start the global loading indicator.
			progress: null,  // Clear any old progress bars.
		}));
	};

	// A new handler for when the entire fetch/stream process fails.
	const handleStreamFailure = (error: string) => {
		console.error("Fatal stream error:", error);
		update(state => ({
			...state,
			isLoading: false,
			activeStreams: new Set(),
			progress: null,
		}));
	};
	
	const reset = () => {
		set({
			messages: [],
			activeStreams: new Set(),
			progress: null,
			isLoading: false,
			sessionId: null,
		});
	};

	return { 
		subscribe, 
		sendMessage, 
		handleStreamEvent, 
		handleStreamFailure, 
		reset 
	};
}

export const chatStore = createChatStore();