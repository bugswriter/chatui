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
	let reattachedFiles: Attachment[] = [];

	onMount(() => {
		authStore.initialize();
	});

	function handleReattach(event: CustomEvent<Attachment>) {
		const newAttachment = event.detail;
		// Prevent adding duplicate files
		if (!reattachedFiles.some((file) => file.s3_key === newAttachment.s3_key)) {
			reattachedFiles = [...reattachedFiles, newAttachment];
		}
	}

	function handleRemoveReattached(event: CustomEvent<{ index: number }>) {
		reattachedFiles = reattachedFiles.filter((_, i) => i !== event.detail.index);
	}

	// ✅ REFACTORED: Simplified logic based on the new chatStore.
	async function handleSendMessage(event: CustomEvent<{ message: string; attachments: Attachment[] }>) {
		const { message, attachments } = event.detail;

		// The store now handles optimistic UI updates and setting isLoading.
		chatStore.sendMessage(message, attachments);
		
		// Clear re-attached files immediately after sending.
		reattachedFiles = [];

		// The streamChat function now calls the store's handlers directly.
		// The store itself will reset its state on stream_end or error events.
		await streamChat(
			message,
			$chatStore.sessionId,
			attachments,
			chatStore.handleStreamEvent, // The success handler
			chatStore.handleStreamFailure  // The fatal error handler
		);
	}

	// ✅ NEW: Calculate isStreaming based on the new activeStreams set.
	$: isStreaming = $chatStore.activeStreams.size > 0;

</script>

<!-- Initial Auth Check Loading Spinner -->
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
				progress={$chatStore.progress}
				isLoading={$chatStore.isLoading}
				userName={$authStore.user.name}
				on:reattach={handleReattach}
			/>
			<ChatInput
				isLoading={$chatStore.isLoading}
				{isStreaming}
				{reattachedFiles}
				on:send={handleSendMessage}
				on:removeReattached={handleRemoveReattached}
			/>
		</div>
	</main>
	<!-- Logged-out Landing Page -->
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

<!-- Modals -->
<LoginModal isOpen={isLoginOpen} on:close={() => (isLoginOpen = false)} />
<SettingsModal isOpen={isSettingsOpen} on:close={() => (isSettingsOpen = false)} />