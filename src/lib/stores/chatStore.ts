// src/lib/stores/chatStore.ts

import { writable } from 'svelte/store';
import type { Message, ProgressInfo, StreamEvent, Attachment, Agent } from '$lib/types';

function createChatStore() {
	const { subscribe, set, update } = writable<{
		messages: Message[];
		activeStreams: Set<string>;
		// ✅ REMOVED: Global progress is no longer needed.
		// progress: ProgressInfo | null;
		isLoading: boolean;
		sessionId: string | null;
		activeAgent: Partial<Agent> | null;
	}>({
		messages: [],
		activeStreams: new Set(),
		// progress: null, // ✅ REMOVED
		isLoading: false,
		sessionId: null,
		activeAgent: null
	});

	const handleStreamEvent = (event: StreamEvent) => {
		update((state) => {
			switch (event.type) {
				case 'session_id':
					return { ...state, sessionId: event.session_id || state.sessionId };

				case 'user_message_receipt':
					const messagesWithReceipt = [...state.messages];
					const optimisticIndex = messagesWithReceipt.findIndex((m) => m.id.startsWith('client_'));
					if (optimisticIndex !== -1 && event.message) {
						messagesWithReceipt[optimisticIndex] = {
							...event.message,
							timestamp: new Date()
						};
					}
					return { ...state, messages: messagesWithReceipt };

				case 'stream_start':
					state.activeStreams.add(event.message_id!);
					// ✅ REMOVED: No longer clearing global progress here.
					return state;

				case 'assistant_message_start':
					if (event.message?.id && !state.messages.some((m) => m.id === event.message.id)) {
						const newMessages = [...state.messages];
						const newAgent = event.message.agent;

						if (state.activeAgent && newAgent && state.activeAgent.id !== newAgent.id) {
							const systemMessage: Message = {
								id: `system_${event.message.id}`,
								role: 'system',
								content: `${state.activeAgent.name} has left. ${newAgent.name} has joined.`,
								timestamp: new Date()
							};
							newMessages.push(systemMessage);
						}

						const newMessage: Message = {
							...event.message,
							content: '',
							timestamp: new Date(),
							progress: null // ✅ ADDED: Initialize progress for this message.
						};
						newMessages.push(newMessage);

						return {
							...state,
							isLoading: false,
							messages: newMessages,
							activeAgent: newAgent || state.activeAgent
						};
					}
					return state;

				case 'content_chunk':
					const messagesWithChunk = state.messages.map((m) => {
						if (m.id === event.message_id) {
							const newContent = m.isPending ? event.chunk || '' : m.content + (event.chunk || '');
							// ✅ ADDED: Clear progress once content starts streaming in.
							return { ...m, content: newContent, isPending: false, progress: null };
						}
						return m;
					});
					return { ...state, messages: messagesWithChunk };

				case 'assistant_attachment':
					const messagesWithAttachment = state.messages.map((m) => {
						if (m.id === event.message_id) {
							const existingAttachments = m.attachments || [];
							const newAttachments = event.attachments || [];
							return { ...m, attachments: [...existingAttachments, ...newAttachments] };
						}
						return m;
					});
					return { ...state, messages: messagesWithAttachment };

				// ✅ MODIFIED: This case now updates the specific message.
				case 'progress':
					const messagesWithProgress = state.messages.map((m) => {
						if (m.id === event.message_id) {
							const progressInfo: ProgressInfo = {
								agent_name: event.agent_name || m.agent?.name || 'Agent',
								message: event.message || 'Working...',
								progress: event.progress ?? 0,
								total: event.total ?? 0
							};
							return { ...m, progress: progressInfo };
						}
						return m;
					});
					return { ...state, messages: messagesWithProgress };

				case 'stream_end':
					state.activeStreams.delete(event.message_id!);
					// ✅ ADDED: Clear progress from the completed message.
					const finalMessages = state.messages.map((m) => {
						if (m.id === event.message_id) {
							return { ...m, progress: null };
						}
						return m;
					});
					return { ...state, messages: finalMessages };

				case 'error':
					console.error('Stream Error Event:', event.error);
					// ✅ REMOVED: Global progress state is gone.
					return {
						...state,
						isLoading: false,
						activeStreams: new Set()
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
			timestamp: new Date()
		};

		update((state) => ({
			...state,
			messages: [...state.messages, userMessage],
			isLoading: true
			// ✅ REMOVED: progress: null
		}));
	};

	const handleStreamFailure = (error: string) => {
		console.error('Fatal stream error:', error);
		update((state) => ({
			...state,
			isLoading: false,
			activeStreams: new Set()
			// ✅ REMOVED: progress: null
		}));
	};

	const reset = () => {
		set({
			messages: [],
			activeStreams: new Set(),
			// ✅ REMOVED: progress: null
			isLoading: false,
			sessionId: null,
			activeAgent: null
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