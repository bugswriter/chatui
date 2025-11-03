<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Download, Reply, FileText, Film, Music } from 'lucide-svelte';
	import type { Attachment } from '$lib/types';
	import { formatFileSize } from '$lib/utils';

	export let attachment: Attachment;
	export let url: string | undefined = undefined;

	const dispatch = createEventDispatcher();

	const videoExtensions = /\.(mp4|webm|mov|ogg|avi)$/i;
	const audioExtensions = /\.(mp3|wav|ogg|m4a)$/i;

	$: isVideo =
		attachment?.content_type?.startsWith('video/') ||
		(attachment?.filename && videoExtensions.test(attachment.filename));
	$: isAudio =
		attachment?.content_type?.startsWith('audio/') ||
		(attachment?.filename && audioExtensions.test(attachment.filename));

	function handleReattach() {
		dispatch('reattach', { ...attachment, url });
	}

	function handleDownload() {
		dispatch('download', attachment);
	}
</script>

<!-- UNIFIED DESIGN: Standard light card look with consistent colors -->
<div
	class="flex items-center gap-3 rounded-lg border bg-gray-50 border-gray-200 p-2.5 text-sm shadow-sm"
>
	<!-- Icon -->
	<div
		class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-white shadow-inner"
	>
		{#if isVideo}
			<Film class="h-5 w-5 text-gray-500" />
		{:else if isAudio}
			<Music class="h-5 w-5 text-gray-500" />
		{:else}
			<FileText class="h-5 w-5 text-gray-500" />
		{/if}
	</div>

	<!-- File Info -->
	<div class="flex-1 min-w-0">
		<p class="truncate font-medium text-gray-900">{attachment.filename}</p>
		<p class="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
	</div>

	<!-- Action Buttons -->
	<div class="flex flex-shrink-0">
		<button
			on:click={handleReattach}
			class="p-2 rounded-md text-gray-500 hover:bg-white hover:text-gray-900 transition"
			aria-label="Re-attach file"
		>
			<Reply class="w-4 h-4" />
		</button>
		<button
			on:click={handleDownload}
			class="p-2 rounded-md text-gray-500 hover:bg-white hover:text-gray-900 transition"
			aria-label="Download file"
		>
			<Download class="w-4 h-4" />
		</button>
	</div>
</div>
