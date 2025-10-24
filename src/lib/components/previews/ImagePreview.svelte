<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Attachment } from '$lib/types';
	import ActionBar from './ActionBar.svelte';

	export let attachment: Attachment;
	export let url: string | undefined = undefined;

	const dispatch = createEventDispatcher();

	// A helper function to forward events from the child (ActionBar)
	// up to the parent component (AttachmentPreview).
	function forward(event: CustomEvent) {
		dispatch(event.type, event.detail);
	}
</script>

<button
	on:click={() => dispatch('viewImage', { url })}
	class="group relative block w-full cursor-zoom-in overflow-hidden rounded-lg border border-border text-left shadow-sm"
	aria-label="View image {attachment.filename} in fullscreen"
>
	<img
		src={url}
		alt={attachment.filename}
		class="h-auto w-full object-cover"
		on:load={() => dispatch('contentLoaded')}
	/>

	<!-- The action bar is now neatly included -->
	<ActionBar {attachment} {url} on:reattach={forward} on:download={forward} />
</button>