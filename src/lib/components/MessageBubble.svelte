<!-- src/lib/components/MessageBubble.svelte -->

<script lang="ts">
	import { Bot, User } from 'svelte-lucide';
	import { marked } from 'marked';
	import { createEventDispatcher } from 'svelte';
	import type { Message, ProgressInfo, Attachment } from '$lib/types';
	import { getPresignedUrl } from '$lib/services/files';
	import AttachmentPreview from './AttachmentPreview.svelte';

	// --- Props ---
	export let message: Message;
	export let isStreaming: boolean = false;
	export let progress: ProgressInfo | null = null;
	export let userName: string = 'You';

	const dispatch = createEventDispatcher();

	// --- Component State ---
	let attachmentUrls: Record<string, string> = {};

	// --- Reactive Logic ($:) ---
	$: isUser = message?.role === 'user';
	$: displayName = isUser ? userName : message?.agent?.name || 'Assistant';
	$: showCursor = isStreaming && message.content && message.content.length > 0;
	
	// ✅ NEW: Calculate progress percentage for the loading ring
	$: progressPercent = progress ? (progress.progress / progress.total) * 100 : 0;
	
	// ✅ NEW: Determine if the progress indicator should be active
	// It's active if we have progress data, and the message content hasn't started yet,
	// OR if the content has started but the progress isn't complete.
	$: isProgressActive = progress && (message.content.length === 0 || progressPercent < 100);

	$: {
		const loadUrls = async () => {
			if (message?.attachments) {
				const urlsToSet: Record<string, string> = {};
				for (const att of message.attachments) {
					const key = att.file_id || att.s3_key;
					if (!key) continue;

					// --- THE CORE FIX for Attachments ---
					// 1. If a URL is already present, use it. This is the most common case.
					if (att.url) {
						urlsToSet[key] = att.url;
					}
					// 2. Only fetch a URL if it's missing AND it's an ASSISTANT's message.
					// We now trust that user message URLs will be provided by the receipt event.
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
			// Using a simple link click for download is more reliable across browser policies
			const link = document.createElement('a');
			link.href = url;
			link.download = attachment.filename;
			// For S3 urls, adding target="_blank" can sometimes help bypass CORS issues on direct download
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

		<!-- ✅ NEW: Progress Indicator UI -->
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

		<!-- Only show the message content bubble if there is content -->
		{#if message.content}
			<div
				class="relative z-10 rounded-[18px] px-4 py-2.5 text-base leading-relaxed shadow-sm {isUser
					? 'bg-user text-user-foreground'
					: 'bg-muted/60 backdrop-blur-lg text-foreground'}"
			>
				<div class="prose">
					{@html marked.parse(message.content)}
					{#if showCursor}<span class="inline-block animate-pulse">▋</span>{/if}
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
	/* Prose styles for markdown content */
	.prose :global(p) { margin-bottom: 0.5rem; }
	.prose :global(p:last-child) { margin-bottom: 0; }
	.prose :global(code) { background-color: rgba(0, 0, 0, 0.1); padding: 0.1em 0.3em; border-radius: 4px; font-size: 0.9em; }
	.prose :global(pre) { background-color: rgba(0, 0, 0, 0.2); padding: 0.75rem; border-radius: 8px; overflow-x: auto; font-size: 0.9em; }
	.prose :global(pre code) { background-color: transparent; padding: 0; }
	.prose :global(ul),
	.prose :global(ol) { margin-left: 1.5rem; margin-bottom: 0.5rem; }
	.prose :global(blockquote) { border-left: 3px solid hsl(var(--primary)); padding-left: 1rem; margin-left: 0; font-style: italic; color: hsl(var(--muted-foreground)); }
</style>