<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Attachment } from '$lib/types';
	import ActionBar from './ActionBar.svelte';

	export let attachment: Attachment;
	export let url: string | undefined = undefined;

	const dispatch = createEventDispatcher();

	function forward(event: CustomEvent) {
		dispatch(event.type, event.detail);
	}
</script>

<!-- UNIFIED DESIGN: Standard border/shadow -->
<div class="group relative w-full overflow-hidden rounded-lg border border-gray-200 shadow-sm">
	<video src={url} controls class="block w-full" />

	<ActionBar {attachment} {url} on:reattach={forward} on:download={forward} />
</div>
