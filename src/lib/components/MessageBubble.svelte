<script lang="ts">
	import { Bot, User } from 'svelte-lucide';
	import { marked } from 'marked';
	import { createEventDispatcher } from 'svelte';
	import type { Message, ProgressInfo, Attachment, Agent } from '$lib/types';
	import { getPresignedUrl } from '$lib/services/files';
	import { chatStore } from '$lib/stores/chatStore';
	import { agentStore } from '$lib/stores/agentStore'; // ✅ IMPORT agentStore
	import AttachmentPreview from './AttachmentPreview.svelte';
	import AgentPopover from './AgentPopover.svelte'; // ✅ IMPORT the new popover

	// --- Props ---
	export let message: Message;
	export let progress: ProgressInfo | null = null;
	export let userName: string = 'You';

	const dispatch = createEventDispatcher();

	// --- Component State ---
	let attachmentUrls: Record<string, string> = {};
	let isCurrentlyStreaming = false;
	let parsedContent: string = ''; // Will hold the HTML with highlighted agent tags

	// --- ✅ NEW: State for Agent Popover ---
	let hoveredAgent: Agent | undefined = undefined;
	let hoveredAgentElement: HTMLElement | null = null;

	// --- Reactive Logic ($:) ---
	$: isUser = message?.role === 'user';
	$: displayName = isUser ? userName : message?.agent?.name || 'Assistant';

	chatStore.subscribe(store => {
		isCurrentlyStreaming = store.activeStreams.has(message.id);
	});

	$: showCursor = isCurrentlyStreaming && message.content && message.content.length > 0;
	$: progressPercent = progress ? (progress.progress / progress.total) * 100 : 0;
	$: isProgressActive = !isUser && isCurrentlyStreaming && progress;

	// ✅ NEW: Reactive block to parse content for agent tags
	$: {
		// First, parse the markdown to HTML
		const baseHtml = marked.parse(message.content);
		
		// Then, find and replace valid @agent tags within the HTML
		parsedContent = baseHtml.replace(/@(\w+)/g, (match, agentName) => {
			const agent = agentStore.findByName(agentName);
			if (agent) {
				// If a valid agent is found, wrap it in a styled span with a data attribute
				return `<span class="agent-tag" data-agent-name="${agentName}">${match}</span>`;
			}
			// If not a valid agent, return the original text
			return match;
		});
	}

	$: {
		// ... (attachment URL loading logic is unchanged)
		const loadUrls = async () => {
			if (message?.attachments) {
				const urlsToSet: Record<string, string> = {};
				for (const att of message.attachments) {
					const key = att.file_id || att.s3_key;
					if (!key) continue;
					if (att.url) {
						urlsToSet[key] = att.url;
					} else if (att.file_id && message.role === 'assistant' && !attachmentUrls[key]) {
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

	// --- ✅ NEW: Event Handlers for Popover ---
	function handleMouseOver(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (target.classList.contains('agent-tag')) {
			const agentName = target.dataset.agentName;
			if (agentName) {
				const agent = agentStore.findByName(agentName);
				if (agent) {
					hoveredAgent = agent;
					hoveredAgentElement = target;
				}
			}
		}
	}

	function handleMouseOut() {
		hoveredAgent = undefined;
		hoveredAgentElement = null;
	}
</script>

<!-- ✅ NEW: Render the popover component, it will be controlled by state -->
<AgentPopover agent={hoveredAgent} targetElement={hoveredAgentElement} />

<div
	class="flex animate-[fade-in_0.5s_ease-out] mb-4 gap-3"
	class:justify-end={isUser}
	class:justify-start={!isUser}
>
	{#if !isUser}
		<!-- ... (Avatar logic is unchanged) ... -->
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

		<!-- ... (Progress indicator and attachment logic are unchanged) ... -->
		{#if isProgressActive}
			<div class="flex items-center gap-2 rounded-lg bg-muted/60 backdrop-blur-lg p-3 text-sm text-foreground shadow-sm">
				<!-- ... progress svg ... -->
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

		{#if message.content || isCurrentlyStreaming}
			<div
				class="relative z-10 rounded-[18px] px-4 py-2.5 text-base leading-relaxed shadow-sm {isUser
					? 'bg-user text-user-foreground'
					: 'bg-muted/60 backdrop-blur-lg text-foreground'}"
				on:mouseover={handleMouseOver}
				on:mouseout={handleMouseOut}
			>
				<div class="prose">
					{#if !message.content && isCurrentlyStreaming}
						<!-- ... (typing indicator logic is unchanged) ... -->
					{:else}
						{@html parsedContent}
						{#if showCursor}<span class="inline-block animate-pulse">▋</span>{/if}
					{/if}
				</div>
			</div>
		{/if}
	</div>

	{#if isUser}
		<!-- ... (User avatar logic is unchanged) ... -->
		<div
			class="flex h-10 w-10 flex-shrink-0 items-center justify-center self-end rounded-full bg-user text-user-foreground shadow-md"
		>
			<User class="h-5 w-5" />
		</div>
	{/if}
</div>

<style>
	/* ... (Prose styles are unchanged) ... */
	.prose :global(p) { margin-bottom: 0.5rem; }
	.prose :global(p:last-child) { margin-bottom: 0; }

	/* ✅ NEW: Styles for the highlighted agent tag */
	.prose :global(.agent-tag) {
		font-weight: 600;
		background-color: hsla(var(--primary) / 0.1);
		padding: 2px 4px;
		border-radius: 4px;
		border-bottom: 2px solid hsla(var(--primary) / 0.3);
		cursor: pointer;
		transition: background-color 0.2s;
	}
	.prose :global(.agent-tag:hover) {
		background-color: hsla(var(--primary) / 0.2);
	}
</style>