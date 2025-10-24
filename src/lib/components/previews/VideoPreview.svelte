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

<div class="group relative w-full overflow-hidden rounded-lg border border-border shadow-sm">
	<video src={url} controls class="block w-full" />

	<!-- The action bar is now neatly included -->
	<ActionBar {attachment} {url} on:reattach={forward} on:download={forward} />
</div>