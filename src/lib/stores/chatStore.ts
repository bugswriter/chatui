// src/lib/stores/chatStore.ts

import { writable } from 'svelte/store';
import type { Message, ProgressInfo, StreamEvent, Attachment, Agent } from '$lib/types';

function createChatStore() {
	const { subscribe, set, update } = writable<{
		messages: Message[];
		activeStreams: Set<string>;
		progress: ProgressInfo | null;
		isLoading: boolean;
		sessionId: string | null;
		activeAgent: Partial<Agent> | null; // ✅ ADDED: Track the current agent
	}>({
		messages: [],
		activeStreams: new Set(),
		progress: null,
		isLoading: false,
		sessionId: null,
		activeAgent: null // ✅ ADDED: Initialize as null
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
					return { ...state, progress: null };

				case 'assistant_message_start':
					if (event.message?.id && !state.messages.some((m) => m.id === event.message.id)) {
						const newMessages = [...state.messages];
						const newAgent = event.message.agent;

						// ✅ ADDED: Logic to detect and announce agent change
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
							timestamp: new Date()
						};
						newMessages.push(newMessage);

						return {
							...state,
							isLoading: false,
							messages: newMessages,
							activeAgent: newAgent || state.activeAgent // Update the active agent
						};
					}
					return state;

				case 'content_chunk':
					const messagesWithChunk = state.messages.map((m) => {
						if (m.id === event.message_id) {
							const newContent = m.isPending ? event.chunk || '' : m.content + (event.chunk || '');
							return { ...m, content: newContent, isPending: false };
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

				case 'progress':
					return { ...state, progress: event as ProgressInfo };

				case 'stream_end':
					state.activeStreams.delete(event.message_id!);
					if (state.activeStreams.size === 0) {
						return { ...state, progress: null };
					}
					return state;

				case 'error':
					console.error('Stream Error Event:', event.error);
					return {
						...state,
						isLoading: false,
						activeStreams: new Set(),
						progress: null
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
			isLoading: true,
			progress: null
		}));
	};

	const handleStreamFailure = (error: string) => {
		console.error('Fatal stream error:', error);
		update((state) => ({
			...state,
			isLoading: false,
			activeStreams: new Set(),
			progress: null
		}));
	};

	const reset = () => {
		set({
			messages: [],
			activeStreams: new Set(),
			progress: null,
			isLoading: false,
			sessionId: null,
			activeAgent: null // ✅ ADDED: Reset the agent on logout
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