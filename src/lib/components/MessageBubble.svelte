<script lang="ts">
	import { Bot, User, Info } from 'lucide-svelte';
	import { marked } from 'marked';
	import { createEventDispatcher } from 'svelte';
	import type { Message, ProgressInfo, Attachment, Agent } from '$lib/types';
	import { getPresignedUrl } from '$lib/services/files';
	import { chatStore } from '$lib/stores/chatStore';
	import { agentStore } from '$lib/stores/agentStore';
	import AttachmentPreview from './AttachmentPreview.svelte';
	import AgentPopover from './AgentPopover.svelte';

	// --- Props ---
	export let message: Message;
	// ✅ REMOVED: The global progress prop is no longer needed.
	// export let progress: ProgressInfo | null = null;
	export let userName: string = 'You';

	const dispatch = createEventDispatcher();

	// --- Component State ---
	let attachmentUrls: Record<string, string> = {};
	let isCurrentlyStreaming = false;
	let parsedContent: string = '';

	// --- Agent Popover State ---
	let hoveredAgent: Agent | undefined = undefined;
	let hoveredAgentElement: HTMLElement | null = null;

	// --- Reactive Logic ($:) ---
	$: isUser = message?.role === 'user';
	$: isSystem = message?.role === 'system'; // ✅ ADDED: System message check
	$: displayName = isUser ? userName : message?.agent?.name || 'Assistant';

	chatStore.subscribe((store) => {
		isCurrentlyStreaming = store.activeStreams.has(message.id);
	});

	$: showCursor = isCurrentlyStreaming && message.content && message.content.length > 0;
	// ✅ REMOVED: isProgressActive logic is no longer needed.

	$: {
		const baseHtml = marked.parse(message.content || '');
		parsedContent = baseHtml.replace(/@(\w+)/g, (match, agentName) => {
			const agent = agentStore.findByName(agentName);
			if (agent) {
				return `<span class="agent-tag" data-agent-name="${agentName}">${match}</span>`;
			}
			return match;
		});
	}

	$: {
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
							urlsToSet[key] = await getPresignedUrl(att.file_id);
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

	// ✅ ADDED: Helper to calculate progress percentage
	$: progressPercentage =
		message.progress && message.progress.total > 0
			? (message.progress.progress / message.progress.total) * 100
			: 0;
</script>

<AgentPopover agent={hoveredAgent} targetElement={hoveredAgentElement} />

<!-- ✅ ADDED: System Message Styling -->
{#if isSystem}
	<div class="my-3 flex items-center justify-center gap-3 text-sm text-muted-foreground">
		<div class="h-px w-full flex-1 bg-border" />
		<div class="flex items-center gap-2">
			<Info class="h-4 w-4" />
			<span>{message.content}</span>
		</div>
		<div class="h-px w-full flex-1 bg-border" />
	</div>
{:else}
	<!-- Existing User/Assistant Message Layout -->
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

			{#if message.attachments && message.attachments.length > 0}
				<div class="flex w-full max-w-sm flex-col gap-2">
					{#each message.attachments as attachment (attachment.s3_key || attachment.file_id)}
						{@const key = attachment.file_id || attachment.s3_key}
						<AttachmentPreview
							{attachment}
							url={attachment.url || (key ? attachmentUrls[key] : undefined)}
							on:reattach={handleReattach}
							on:download={handleDownload}
							on:contentLoaded={() => dispatch('contentLoaded')}
							on:viewImage={(e) => dispatch('viewImage', e.detail)}
						/>
					{/each}
				</div>
			{/if}

			{#if message.content || isCurrentlyStreaming || message.progress}
				<div
					class="relative z-10 rounded-xl px-4 py-2.5 text-base leading-relaxed shadow-sm {isUser
						? 'bg-user text-user-foreground'
						: 'bg-muted text-foreground'}"
					on:mouseover={handleMouseOver}
					on:mouseout={handleMouseOut}
				>
					<!-- ✅ MODIFIED: The main content container -->
					<div class="prose break-words">
						<!-- ✅ MODIFIED: Show Progress Bar OR "Thinking..." OR Content -->
						{#if message.progress}
							<div class="w-64 text-sm">
								<p class="font-semibold text-foreground/90">{message.progress.agent_name}</p>
								<p class="text-xs text-muted-foreground/80 mb-2 truncate">
									{message.progress.message}
								</p>
								<div class="w-full bg-border rounded-full h-1.5">
									<div
										class="bg-primary h-1.5 rounded-full transition-all duration-300"
										style="width: {progressPercentage}%"
									></div>
								</div>
							</div>
						{:else if !message.content && isCurrentlyStreaming}
							<div class="flex items-center gap-1.5">
								<span class="h-2 w-2 rounded-full bg-current/60 animate-bounce"></span>
								<span
									class="h-2 w-2 rounded-full bg-current/60 animate-bounce [animation-delay:0.2s]"
								></span>
								<span
									class="h-2 w-2 rounded-full bg-current/60 animate-bounce [animation-delay:0.4s]"
								></span>
							</div>
						{:else}
							{@html parsedContent}
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
{/if}

<style>
	/* Scoped prose styles for message bubbles */
	.prose :global(p) {
		margin-bottom: 0.5rem;
	}
	.prose :global(p:last-child) {
		margin-bottom: 0;
	}

	/* ✅ ADDED: Make sure prose doesn't override word break */
	.prose {
		overflow-wrap: break-word;
		word-wrap: break-word;
	}

	/* Styles for the highlighted agent tag */
	.prose :global(.agent-tag) {
		font-weight: 600;
		background-color: hsl(var(--primary) / 0.15);
		padding: 2px 5px;
		border-radius: var(--radius-sm);
		border-bottom: 2px solid hsl(var(--primary) / 0.3);
		cursor: pointer;
		transition: background-color 0.2s;
	}
	.prose :global(.agent-tag:hover) {
		background-color: hsl(var(--primary) / 0.25);
	}
</style>