<!-- src/lib/components/ChatHistory.svelte -->
<script lang="ts">
	import { afterUpdate } from 'svelte';
	import type { Message, ProgressInfo } from '$lib/types';
	import MessageBubble from './MessageBubble.svelte';
	import LoadingMessage from './LoadingMessage.svelte';

	export let messages: Message[] = [];
	export let progress: ProgressInfo | null = null;
	export let isLoading: boolean = false; // This is the global loading state before the first AI message appears
	export let userName: string = 'You';

	let scrollContainer: HTMLDivElement;
	let shouldAutoScroll = true;

	afterUpdate(() => {
		if (shouldAutoScroll && scrollContainer) {
			scrollContainer.scrollTo({
				top: scrollContainer.scrollHeight,
				behavior: 'smooth'
			});
		}
	});

	function handleScroll() {
		if (!scrollContainer) return;
		const threshold = 50;
		const isAtBottom =
			scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight <
			threshold;
		shouldAutoScroll = isAtBottom;
	}
</script>

<div
	bind:this={scrollContainer}
	on:scroll={handleScroll}
	class="flex-1 overflow-y-auto bg-gradient-to-b from-background/80 via-background/60 to-background/80 px-4 py-6"
>
	<div class="mx-auto max-w-3xl">
		{#if messages.length === 0}
			<!-- Welcome Screen (unchanged) -->
			<div class="flex flex-col items-center justify-center text-center py-24">
				<img
					src="https://i.pinimg.com/originals/31/38/c2/3138c2666fe9ffc47d4c56982c918a31.jpg"
					alt="hannah"
					class="h-28 w-28 rounded-full object-cover shadow-xl border-2 border-primary"
				/>
				<h1 class="mt-6 text-3xl font-bold text-primary">Hannah's Hive</h1>
				<p class="mt-3 max-w-md text-base text-muted-foreground leading-relaxed">
					Your quirky assistant is ready to help. Start a conversation or upload files to begin.
				</p>
				<div class="mt-6 flex gap-3">
					<button class="px-5 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition">
						Start Chat
					</button>
					<button class="px-5 py-2 rounded-lg border border-primary text-primary hover:bg-primary/10 transition">
						Upload Files
					</button>
				</div>
			</div>
		{:else}
			<!-- Message List -->
			<div class="flex flex-col gap-4">
				{#each messages as message (message.id)}
					<!-- ✅ REFACTORED: The progress prop is no longer needed here.
					    It will be displayed as a separate element within MessageBubble.
					    We also remove the complex isLastAssistant logic. -->
					<MessageBubble
						{message}
						{progress}
						{userName}
						on:reattach
					/>
				{/each}

				<!-- ✅ SIMPLIFIED: Shows a generic loading message bubble after the user message is sent,
				     and disappears when the assistant's placeholder bubble (`assistant_message_start`) arrives. -->
				{#if isLoading}
					<div class="flex justify-start mt-4">
						<LoadingMessage />
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>