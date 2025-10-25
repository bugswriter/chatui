<script lang="ts">
	import { Bot, User, Info } from 'lucide-svelte';
	import { marked } from 'marked';
	import { markedHighlight } from 'marked-highlight';
	import hljs from 'highlight.js/lib/core';
	import javascript from 'highlight.js/lib/languages/javascript';
	import python from 'highlight.js/lib/languages/python';
	import bash from 'highlight.js/lib/languages/bash';
	import typescript from 'highlight.js/lib/languages/typescript';
	import json from 'highlight.js/lib/languages/json';
	import { createEventDispatcher, afterUpdate } from 'svelte';
	import type { Message, Attachment, Agent } from '$lib/types';
	import { getPresignedUrl } from '$lib/services/files';
	import { chatStore } from '$lib/stores/chatStore';
	import { agentStore } from '$lib/stores/agentStore';
	import AttachmentPreview from './AttachmentPreview.svelte';
	import AgentPopover from './AgentPopover.svelte';

	hljs.registerLanguage('javascript', javascript);
	hljs.registerLanguage('python', python);
	hljs.registerLanguage('bash', bash);
	hljs.registerLanguage('typescript', typescript);
	hljs.registerLanguage('json', json);

	marked.use(
		markedHighlight({
			langPrefix: 'hljs language-',
			highlight(code, lang) {
				const language = hljs.getLanguage(lang) ? lang : 'plaintext';
				return hljs.highlight(code, { language }).value;
			}
		})
	);

	export let message: Message;
	export let userName: string = 'You';
	export let userAvatarUrl: string | null | undefined = undefined;

	const dispatch = createEventDispatcher();
	let bubbleElement: HTMLDivElement;
	let attachmentUrls: Record<string, string> = {};
	let isCurrentlyStreaming = false;
	let parsedContent: string = '';
	let hoveredAgent: Agent | undefined = undefined;
	let hoveredAgentElement: HTMLElement | null = null;

	$: isUser = message?.role === 'user';
	$: isSystem = message?.role === 'system';
	$: displayName = isUser ? userName : message?.agent?.name || 'Assistant';

	chatStore.subscribe((store) => {
		isCurrentlyStreaming = store.activeStreams.has(message.id);
	});

	$: showCursor = isCurrentlyStreaming && message.content && message.content.length > 0;

	$: {
		(async () => {
			const baseHtml = await marked.parse(message.content || '', { breaks: true, async: false });
			parsedContent = (baseHtml as string).replace(/@(\w+)/g, (match: string, agentName: string) => {
				const agent = agentStore.findByName(agentName);
				if (agent) {
					return `<span class="agent-tag" data-agent-name="${agentName}">${match}</span>`;
				}
				return match;
			});
		})();
	}

	$: {
		const loadUrls = async () => {
			if (message?.attachments) {
				for (const att of message.attachments) {
					const key = att.file_id || att.s3_key;
					if (!key) continue;
					if (!att.url && att.file_id && message.role === 'assistant' && !attachmentUrls[key]) {
						try {
							const url = await getPresignedUrl(att.file_id);
							attachmentUrls = { ...attachmentUrls, [key]: url };
						} catch (e) {
							console.error(`Failed to fetch temp URL for ${att.file_id}:`, e);
						}
					}
				}
			}
		};
		loadUrls();
	}

	afterUpdate(() => {
		if (bubbleElement) {
			const codeBlocks = bubbleElement.querySelectorAll('pre');
			codeBlocks.forEach((block) => {
				if (block.querySelector('.copy-button')) return;
				const button = document.createElement('button');
				button.className = 'copy-button';
				button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
				block.prepend(button);
				button.addEventListener('click', () => {
					const code = block.querySelector('code');
					if (code) {
						navigator.clipboard.writeText(code.innerText);
						button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>`;
						setTimeout(() => {
							button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
						}, 2000);
					}
				});
			});
		}
	});

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
				hoveredAgent = agentStore.findByName(agentName);
				hoveredAgentElement = target;
			}
		}
	}
	function handleMouseOut() {
		hoveredAgent = undefined;
		hoveredAgentElement = null;
	}

	$: progressPercentage =
		message.progress && message.progress.total > 0
			? (message.progress.progress / message.progress.total) * 100
			: 0;
</script>

<AgentPopover agent={hoveredAgent} targetElement={hoveredAgentElement} />

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
	<div class="flex mb-4 gap-3" class:justify-end={isUser} class:justify-start={!isUser}>
		<!-- ✅ FIX: Assistant (AI) avatar now shows here on the left -->
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
			bind:this={bubbleElement}
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
					<div class="prose">
						{#if message.progress}
							<div class="w-64 text-sm">
								<p class="font-semibold text-foreground/90">{message.progress.agent_name}</p>
								<p class="text-xs text-muted-foreground/80 mb-2">
									{message.progress.message}
								</p>
								<div class="w-full bg-border rounded-full h-1.5 overflow-hidden">
									<div
										class="animated-progress h-1.5 rounded-full bg-primary transition-all duration-300"
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

		<!-- ✅ FIX: User avatar now shows here on the right -->
		{#if isUser}
			<div
				class="flex h-10 w-10 flex-shrink-0 items-center justify-center self-end rounded-full bg-user shadow-md"
			>
				{#if userAvatarUrl}
					<img
						src={userAvatarUrl}
						alt={userName}
						class="h-full w-full rounded-full object-cover"
					/>
				{:else}
					<div
						class="flex h-full w-full items-center justify-center rounded-full text-user-foreground"
					>
						<User class="h-5 w-5" />
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}

<style>
	@keyframes shimmer {
		100% {
			transform: translateX(100%);
		}
	}
	.animated-progress {
		position: relative;
	}
	.animated-progress::after {
		content: '';
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		transform: translateX(-100%);
		background-image: linear-gradient(
			90deg,
			hsla(var(--primary-foreground) / 0) 0,
			hsla(var(--primary-foreground) / 0.2) 20%,
			hsla(var(--primary-foreground) / 0.5) 60%,
			hsla(var(--primary-foreground) / 0)
		);
		animation: shimmer 2s infinite;
	}
	.prose {
		color: inherit;
		max-width: none;
		word-break: break-word;
	}
	.prose :global(p) {
		margin-top: 0;
		margin-bottom: 0.5rem;
	}
	.prose :global(p:last-child) {
		margin-bottom: 0;
	}
	.prose :global(pre) {
		position: relative;
		font-family: var(--font-mono);
		background-color: hsl(var(--muted) / 0.5);
		color: hsl(var(--foreground));
		border-radius: var(--radius-md);
		padding: 1rem;
		padding-top: 2.5rem;
		margin: 0.5rem 0;
		white-space: pre;
		overflow-x: auto;
		max-width: 100%;
	}
	.prose :global(code:not(pre > code)) {
		background-color: hsl(var(--muted) / 0.5);
		padding: 0.1em 0.3em;
		border-radius: var(--radius-sm);
		font-size: 85%;
	}
	.prose :global(pre code) {
		background-color: transparent;
		padding: 0;
		font-size: 0.9em;
	}
	:global(.copy-button) {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: var(--radius-md);
		background-color: hsl(var(--muted) / 0.8);
		color: hsl(var(--muted-foreground));
		border: 1px solid hsl(var(--border));
		cursor: pointer;
		opacity: 0.5;
		transition: all 0.2s ease;
	}
	:global(pre:hover .copy-button) {
		opacity: 1;
	}
	:global(.copy-button:hover) {
		background-color: hsl(var(--muted));
		color: hsl(var(--foreground));
	}
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