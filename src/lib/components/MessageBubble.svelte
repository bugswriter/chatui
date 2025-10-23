<!-- src/lib/components/MessageBubble.svelte -->
<script lang="ts">
	import { Bot, User } from 'svelte-lucide';
	import { marked } from 'marked';
	import { createEventDispatcher, onMount } from 'svelte';
	import type { Message, ProgressInfo, Attachment } from '$lib/types';
	import { getPresignedUrl } from '$lib/services/files';
	import { chatStore } from '$lib/stores/chatStore'; // Import the store
	import AttachmentPreview from './AttachmentPreview.svelte';

	// --- Props ---
	export let message: Message;
	export let progress: ProgressInfo | null = null;
	export let userName: string = 'You';

	const dispatch = createEventDispatcher();

	// --- Component State ---
	let attachmentUrls: Record<string, string> = {};
	let isCurrentlyStreaming = false;

	// --- Reactive Logic ($:) ---
	$: isUser = message?.role === 'user';
	$: displayName = isUser ? userName : message?.agent?.name || 'Assistant';

	// ✅ NEW: Subscribe to the chatStore to know if *this specific* message is streaming.
	// This replaces the old `isStreaming` prop.
	chatStore.subscribe(store => {
		isCurrentlyStreaming = store.activeStreams.has(message.id);
	});

	$: showCursor = isCurrentlyStreaming && message.content && message.content.length > 0;
	
	// ✅ NEW: Calculate progress percentage for the loading ring
	$: progressPercent = progress ? (progress.progress / progress.total) * 100 : 0;
	
	// ✅ NEW: Determine if the progress indicator should be active.
	// It should only show for the assistant's message that is currently being generated.
	$: isProgressActive = !isUser && isCurrentlyStreaming && progress;

	// This reactive block handles fetching URLs for attachments as they arrive.
	$: {
		const loadUrls = async () => {
			if (message?.attachments) {
				const urlsToSet: Record<string, string> = {};
				for (const att of message.attachments) {
					// Use a consistent key
					const key = att.file_id || att.s3_key;
					if (!key) continue;

					// If a URL is already in the attachment object from the backend, use it.
					if (att.url) {
						urlsToSet[key] = att.url;
					}
					// Otherwise, if it's an assistant message and we don't have a URL yet, fetch it.
					else if (att.file_id && message.role === 'assistant' && !attachmentUrls[key]) {
						try {
							const presignedUrl = await getPresignedUrl(att.file_id);
							urlsToSet[key] = presignedUrl;
						} catch (e) {
							console.error(`Failed to fetch temp URL for ${att.file_id}:`, e);
						}
					}
				}
				if (Object.keys(urlsToSet).length > 0) {
					attachmentUrls = { ...attachmentUrls, ...urlsToSet };
				}
			}
		};
		loadUrls();
	}

	function handleReattach(event: CustomEvent<Attachment>) {
		dispatch('reattach', event.detail);
	}

	async function handleDownload(event: CustomEvent<Attachment>) {
		const attachment = event.detail;
		const url = attachment.url || attachmentUrls[attachment.file_id || attachment.s3_key];
		if (url) {
			const link = document.createElement('a');
			link.href = url;
			link.download = attachment.filename;
			link.target = '_blank';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}
	}
</script>

<div
	class="flex animate-[fade-in_0.5s_ease-out] mb-4 gap-3"
	class:justify-end={isUser}
	class:justify-start={!isUser}
>
	{#if !isUser}
		<div class="flex h-10 w-10 flex-shrink-0 self-end rounded-full bg-muted shadow-md">
			{#if message.agent?.avatar}
				<img
					src={message.agent.avatar}
					alt={message.agent.name}
					class="h-full w-full rounded-full object-cover"
				/>
			{:else}
				<div class="flex items-center justify-center w-full h-full">
					<Bot class="h-5 w-5 text-muted-foreground" />
				</div>
			{/if}
		</div>
	{/if}

	<div
		class="flex flex-col gap-1.5 max-w-[70%]"
		class:items-end={isUser}
		class:items-start={!isUser}
	>
		<div class="px-1 text-xs font-medium text-muted-foreground">{displayName}</div>

		<!-- ✅ NEW: Progress Indicator UI - Renders as a separate bubble -->
		{#if isProgressActive}
			<div class="flex items-center gap-2 rounded-lg bg-muted/60 backdrop-blur-lg p-3 text-sm text-foreground shadow-sm">
				<div class="relative w-5 h-5 flex-shrink-0">
					<!-- Background ring -->
					<svg class="w-full h-full" viewBox="0 0 20 20">
						<circle class="stroke-current text-foreground/10" stroke-width="2" cx="10" cy="10" r="8" fill="transparent" />
					</svg>
					<!-- Progress ring -->
					<svg class="w-full h-full absolute top-0 left-0 transform -rotate-90" viewBox="0 0 20 20">
						<circle
							class="stroke-current text-primary transition-all duration-300 ease-linear"
							stroke-width="2"
							stroke-dasharray="50.26"
							stroke-dashoffset={50.26 - (progressPercent / 100) * 50.26}
							cx="10"
							cy="10"
							r="8"
							fill="transparent"
						/>
					</svg>
				</div>
				<div class="flex flex-col">
					<span class="font-semibold">{progress.agent_name}</span>
					<span class="text-xs opacity-80">{progress.message}</span>
				</div>
			</div>
		{/if}

		{#if message.attachments && message.attachments.length > 0}
			<div class="flex w-full max-w-sm flex-col gap-2">
				{#each message.attachments as attachment (attachment.s3_key || attachment.file_id)}
					{@const key = attachment.file_id || attachment.s3_key}
					<AttachmentPreview
						{attachment}
						url={attachment.url || (key ? attachmentUrls[key] : undefined)}
						on:reattach={handleReattach}
						on:download={handleDownload}
					/>
				{/each}
			</div>
		{/if}

		<!-- Only show the message content bubble if there is content OR if it's streaming (for the placeholder) -->
		{#if message.content || isCurrentlyStreaming}
			<div
				class="relative z-10 rounded-[18px] px-4 py-2.5 text-base leading-relaxed shadow-sm {isUser
					? 'bg-user text-user-foreground'
					: 'bg-muted/60 backdrop-blur-lg text-foreground'}"
			>
				<div class="prose">
					<!-- If there's no content yet but it's streaming, show a typing indicator -->
					{#if !message.content && isCurrentlyStreaming}
						<div class="flex items-center gap-1.5 h-6">
							<span class="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce"></span>
							<span class="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0.2s]"></span>
							<span class="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0.4s]"></span>
						</div>
					{:else}
						{@html marked.parse(message.content)}
						{#if showCursor}<span class="inline-block animate-pulse">▋</span>{/if}
					{/if}
				</div>
			</div>
		{/if}
	</div>

	{#if isUser}
		<div
			class="flex h-10 w-10 flex-shrink-0 items-center justify-center self-end rounded-full bg-user text-user-foreground shadow-md"
		>
			<User class="h-5 w-5" />
		</div>
	{/if}
</div>

<style>
	/* Prose styles for markdown content (Unchanged) */
	.prose :global(p) { margin-bottom: 0.5rem; }
	.prose :global(p:last-child) { margin-bottom: 0; }
	.prose :global(code) { background-color: rgba(0, 0, 0, 0.1); padding: 0.1em 0.3em; border-radius: 4px; font-size: 0.9em; }
	.prose :global(pre) { background-color: rgba(0, 0, 0, 0.2); padding: 0.75rem; border-radius: 8px; overflow-x: auto; font-size: 0.9em; }
	.prose :global(pre code) { background-color: transparent; padding: 0; }
	.prose :global(ul),
	.prose :global(ol) { margin-left: 1.5rem; margin-bottom: 0.5rem; }
	.prose :global(blockquote) { border-left: 3px solid hsl(var(--primary)); padding-left: 1rem; margin-left: 0; font-style: italic; color: hsl(var(--muted-foreground)); }
</style>