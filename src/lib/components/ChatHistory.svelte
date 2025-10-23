<script lang="ts">
	import { afterUpdate } from 'svelte';
	import type { Message, ProgressInfo } from '$lib/types';
	import MessageBubble from './MessageBubble.svelte';
	import LoadingMessage from './LoadingMessage.svelte';

	export let messages: Message[] = [];
	export let progress: ProgressInfo | null = null;
	export let isLoading: boolean = false; // Global loading state before the first AI message
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
	class="flex-1 overflow-y-auto bg-gradient-to-b from-background/95 via-background/90 to-background/95 px-4 py-6"
>
	<div class="mx-auto max-w-3xl">
		{#if messages.length === 0}
			<!-- Welcome Screen -->
			<div class="flex flex-col items-center justify-center text-center py-24">
				<img
					src="https://i.pinimg.com/originals/31/38/c2/3138c2666fe9ffc47d4c56982c918a31.jpg"
					alt="hannah"
					class="h-32 w-32 rounded-full object-cover shadow-2xl shadow-primary/10 border-4 border-primary/50"
				/>
				<h1 class="mt-8 text-4xl font-bold text-foreground">Ready to Assist</h1>
				<p class="mt-3 max-w-md text-base text-muted-foreground leading-relaxed">
					Start a conversation or upload files to begin. I'm here to help with anything you
					need.
				</p>
			</div>
		{:else}
			<!-- Message List -->
			<div class="flex flex-col gap-4">
				{#each messages as message (message.id)}
					<MessageBubble {message} {progress} {userName} on:reattach />
				{/each}

				<!-- Initial loading bubble before the first assistant message arrives -->
				{#if isLoading}
					<div class="flex justify-start mt-4">
						<LoadingMessage />
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>