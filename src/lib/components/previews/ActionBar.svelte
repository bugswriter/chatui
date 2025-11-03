<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Download, Reply } from 'lucide-svelte';
	import type { Attachment } from '$lib/types';

	export let attachment: Attachment;
	export let url: string | undefined = undefined;

	const dispatch = createEventDispatcher();

	function handleReattach() {
		dispatch('reattach', { ...attachment, url });
	}

	function handleDownload() {
		dispatch('download', attachment);
	}
</script>

<!-- UNIFIED DESIGN: Subtle light background/border for floating actions -->
<div
	class="absolute top-2 right-2 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
>
	<button
		on:click|stopPropagation={handleReattach}
		class="flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-gray-700 backdrop-blur-sm shadow-md transition hover:bg-white"
		aria-label="Re-attach file"
	>
		<Reply class="h-4 w-4" />
	</button>
	<button
		on:click|stopPropagation={handleDownload}
		class="flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-gray-700 backdrop-blur-sm shadow-md transition hover:bg-white"
		aria-label="Download file"
	>
		<Download class="h-4 w-4" />
	</button>
</div>
