<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';
	import { X } from 'lucide-svelte';

	export let imageUrl: string;

	const dispatch = createEventDispatcher();

	function closeModal() {
		dispatch('close');
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeModal();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
	on:click={closeModal}
	transition:fade={{ duration: 150 }}
	class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-md"
>
	<div
		transition:fade={{ duration: 150, delay: 50 }}
		class="relative h-full w-full max-w-7xl"
		on:click|stopPropagation
	>
		<!-- Image Container -->
		<div class="flex h-full w-full items-center justify-center">
			<img
				src={imageUrl}
				alt="Fullscreen preview"
				class="block max-h-full max-w-full rounded-lg object-contain shadow-2xl"
			/>
		</div>

		<!-- Close Button -->
		<button
			on:click={closeModal}
			class="absolute top-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-background/50 text-foreground transition-colors hover:bg-background"
			aria-label="Close image view"
		>
			<X class="h-6 w-6" />
		</button>
	</div>
</div>