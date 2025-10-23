<!-- src/routes/+page.svelte -->

<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/authStore';
	import { chatStore } from '$lib/stores/chatStore';
	import { streamChat } from '$lib/services/chat';
	import Navbar from '$lib/components/Navbar.svelte';
	import ChatHistory from '$lib/components/ChatHistory.svelte';
	import ChatInput from '$lib/components/ChatInput.svelte';
	import LoginModal from '$lib/components/LoginModal.svelte';
	import SettingsModal from '$lib/components/SettingsModal.svelte';
	import type { Attachment } from '$lib/types';

	let isLoginOpen = false;
	let isSettingsOpen = false;

	onMount(() => {
		authStore.initialize();
	});

	async function handleSendMessage(event: CustomEvent<{ message: string; attachments: Attachment[] }>) {
		const { message, attachments } = event.detail;

		// This now adds the message to the list immediately with a safe, unique ID.
		chatStore.sendMessage(message, attachments);

		await streamChat(
			message,
			$chatStore.sessionId,
			attachments,
			chatStore.handleStreamEvent,
			(error) => {
				console.error('Fatal stream error:', error);
				chatStore.stopStreaming();
			}
		);

		chatStore.stopStreaming();
	}
</script>

<!-- Initial Auth Check Loading Spinner (unchanged) -->
{#if $authStore.isLoading}
	<div class="flex h-screen w-full items-center justify-center">
		<div
			class="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
		></div>
	</div>
<!-- Main Chat App (Authenticated) -->
{:else if $authStore.isAuthenticated && $authStore.user}
	<main class="flex h-screen flex-col bg-background text-foreground">
		<Navbar on:settingsClick={() => (isSettingsOpen = true)} />
		<div class="flex-1 pt-14 flex flex-col overflow-hidden">
			<ChatHistory
				messages={$chatStore.messages}
				streamingMessageId={$chatStore.streamingMessageId}
				progress={$chatStore.progress}
				isLoading={$chatStore.isLoading}
				userName={$authStore.user.name}
			/>
			<ChatInput
				isLoading={$chatStore.isLoading}
				isStreaming={$chatStore.streamingMessageId !== null}
				on:send={handleSendMessage}
			/>
		</div>
	</main>
<!-- Logged-out Landing Page (unchanged) -->
{:else}
	<div
		class="flex h-screen w-full flex-col items-center justify-center bg-background p-4 text-center"
	>
		<h1
			class="text-5xl font-bold bg-gradient-to-r from-primary to-user bg-clip-text text-transparent"
		>
			Welcome to Hannah's Hive
		</h1>
		<p class="mt-4 max-w-md text-xl text-muted-foreground">
			Your intelligent AI assistant is ready to help with anything you need.
		</p>
		<button
			on:click={() => (isLoginOpen = true)}
			class="mt-8 rounded-full bg-primary py-3 px-8 font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-105"
		>
			Login & Go to Chat
		</button>
	</div>
{/if}

<!-- Modals (unchanged) -->
<LoginModal isOpen={isLoginOpen} on:close={() => (isLoginOpen = false)} />
<SettingsModal isOpen={isSettingsOpen} on:close={() => (isSettingsOpen = false)} />