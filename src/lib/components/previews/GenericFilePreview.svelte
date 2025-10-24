<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Download, Reply, FileText, Film, Music } from 'lucide-svelte';
	import type { Attachment } from '$lib/types';
	import { formatFileSize } from '$lib/utils';

	export let attachment: Attachment;
	export let url: string | undefined = undefined;

	const dispatch = createEventDispatcher();

	// These checks are just for displaying the correct icon
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

<div
	class="flex items-center gap-3 rounded-lg border bg-muted/50 border-border p-2.5 text-sm shadow-sm"
>
	<!-- Icon -->
	<div
		class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-background shadow-inner"
	>
		{#if isVideo}
			<Film class="h-5 w-5 text-muted-foreground" />
		{:else if isAudio}
			<Music class="h-5 w-5 text-muted-foreground" />
		{:else}
			<FileText class="h-5 w-5 text-muted-foreground" />
		{/if}
	</div>

	<!-- File Info -->
	<div class="flex-1 min-w-0">
		<p class="truncate font-medium text-foreground">{attachment.filename}</p>
		<p class="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
	</div>

	<!-- Action Buttons -->
	<div class="flex flex-shrink-0">
		<button
			on:click={handleReattach}
			class="p-2 rounded-md text-muted-foreground hover:bg-background hover:text-foreground transition"
			aria-label="Re-attach file"
		>
			<Reply class="w-4 h-4" />
		</button>
		<button
			on:click={handleDownload}
			class="p-2 rounded-md text-muted-foreground hover:bg-background hover:text-foreground transition"
			aria-label="Download file"
		>
			<Download class="w-4 h-4" />
		</button>
	</div>
</div>