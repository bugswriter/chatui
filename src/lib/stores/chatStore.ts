// src/lib/stores/chatStore.ts

import { writable } from 'svelte/store';
import type { Message, ProgressInfo, StreamEvent, Attachment } from '$lib/types';

function createChatStore() {
	const { subscribe, set, update } = writable<{
		messages: Message[];
		streamingMessageId: string | null;
		progress: ProgressInfo | null;
		isLoading: boolean;
		sessionId: string | null;
	}>({
		messages: [],
		streamingMessageId: null,
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
					if (event.message) {
						const lastUserMessageIndex = state.messages.findLastIndex(
							(m: Message) => m.role === 'user' && m.id.startsWith('client_')
						);

						if (lastUserMessageIndex !== -1) {
							const newMessages = [...state.messages];
							const clientMessage = newMessages[lastUserMessageIndex];
							
							newMessages[lastUserMessageIndex] = {
								...clientMessage,
								...event.message,
								id: clientMessage.id,
								timestamp: new Date(event.message.timestamp),
							};
							return { ...state, messages: newMessages };
						}
					}
					return state;

				case 'assistant_message_start':
					if (event.message?.id && !state.messages.some(m => m.id === event.message.id)) {
						const newMessage: Message = {
							...event.message,
							timestamp: new Date(event.message.timestamp)
						};
						return {
							...state,
							messages: [...state.messages, newMessage],
							streamingMessageId: event.message.id,
						};
					}
					return { ...state, streamingMessageId: event.message?.id };

				case 'content_chunk':
					const newMessages = state.messages.map(m => {
						if (m.id === event.message_id) {
							return { ...m, content: m.content + (event.chunk || '') };
						}
						return m;
					});
					return { ...state, messages: newMessages };
				
				case 'assistant_attachment':
					// ✅ THE DEFINITIVE FIX IS HERE
					// Instead of looking for a non-existent `message_id` on the event,
					// we use the `streamingMessageId` that we already have in our state.
					if (state.streamingMessageId && event.attachments) {
						const attMessages = state.messages.map(m => {
							// Find the message that is currently being streamed to.
							if (m.id === state.streamingMessageId) {
								const existingAttachments = m.attachments || [];
								// Add the new attachments to it.
								return { ...m, attachments: [...existingAttachments, ...event.attachments] };
							}
							return m;
						});
						return { ...state, messages: attMessages };
					}
					return state;
				
				case 'progress':
					return { ...state, progress: { agent_name: event.agent_name!, message: event.message!, progress: event.progress!, total: event.total! } };

				case 'error':
					console.error("Stream Error Event:", event.error);
					return {
						...state,
						isLoading: false,
						streamingMessageId: null,
						progress: null,
					};
			}
			return state;
		});
	};

	const sendMessage = (content: string, attachments: Attachment[]) => {
		const clientSideId = `client_${crypto.randomUUID()}`;

		const userMessage: Message = {
			id: clientSideId,
			role: 'user',
			content: content,
			attachments: attachments,
			timestamp: new Date(),
		};

		update(state => ({
			...state,
			messages: [...state.messages, userMessage],
			isLoading: true,
			progress: null,
		}));
	};

	const stopStreaming = () => {
		update(state => ({
			...state,
			streamingMessageId: null,
			isLoading: false,
			progress: null,
		}));
	};

	const reset = () => {
		set({
			messages: [],
			streamingMessageId: null,
			progress: null,
			isLoading: false,
			sessionId: null,
		});
	};

	return { subscribe, sendMessage, handleStreamEvent, stopStreaming, reset };
}

export const chatStore = createChatStore();