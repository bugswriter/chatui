<script lang="ts">
	import { afterUpdate, tick } from 'svelte';
	import type { Message, ProgressInfo } from '$lib/types';
	import MessageBubble from './MessageBubble.svelte';
	import LoadingMessage from './LoadingMessage.svelte';

	export let messages: Message[] = [];
	export let progress: ProgressInfo | null = null;
	export let isLoading: boolean = false;
	export let userName: string = 'You';
	export let className: string = '';

	let scrollContainer: HTMLDivElement;
	let shouldAutoScroll = true;

	/**
	 * ✅ MODIFIED: Reusable scroll function with a 'force' option.
	 * When force is true, we scroll even if shouldAutoScroll is false.
	 * This is crucial for when new content (like a loaded image) changes the height.
	 */
	async function scrollToBottom(force = false) {
		await tick(); // Wait for DOM to update
		if ((shouldAutoScroll || force) && scrollContainer) {
			scrollContainer.scrollTo({
				top: scrollContainer.scrollHeight,
				behavior: 'smooth'
			});
		}
	}

	// afterUpdate handles scrolling for new text messages.
	afterUpdate(() => scrollToBottom());

	function handleScroll() {
		if (!scrollContainer) return;
		const threshold = 50;
		// Update shouldAutoScroll based on user's scroll position.
		shouldAutoScroll =
			scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight <
			threshold;
	}
</script>

<div
	bind:this={scrollContainer}
	on:scroll={handleScroll}
	class="overflow-y-auto bg-gradient-to-b from-background/95 via-background/90 to-background/95 px-4 py-6 pt-18 {className}"
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
					Start a conversation or upload files to begin. I'm here to help with anything you need.
				</p>
			</div>
		{:else}
			<!-- Message List -->
			<div class="flex flex-col gap-4">
				{#each messages as message (message.id)}
					<MessageBubble
						{message}
						{progress}
						{userName}
						on:reattach
						on:contentLoaded={() => scrollToBottom(true)}
						on:viewImage
					/>
				{/each}

				<!-- Initial loading bubble -->
				{#if isLoading}
					<div class="flex justify-start mt-4">
						<LoadingMessage />
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>