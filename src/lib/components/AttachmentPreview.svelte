<!-- src/lib/components/AttachmentPreview.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Download, Reply, FileText, Film, Music } from 'lucide-svelte';
	import type { Attachment } from '$lib/types';
	import { formatFileSize } from '$lib/utils';
	import { settingsStore } from '$lib/stores/settingsStore';

	export let attachment: Attachment;
	export let url: string | undefined = undefined;

	const dispatch = createEventDispatcher();

	// ✅ DEFINITIVE FIX: Make the component smarter.
	// It now checks the filename extension as a fallback if the content_type is generic.
	// This makes the UI resilient to backend inconsistencies.
	const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i;
	const videoExtensions = /\.(mp4|webm|mov|ogg|avi)$/i;
	const audioExtensions = /\.(mp3|wav|ogg|m4a)$/i;

	$: isImage =
		attachment?.content_type?.startsWith('image/') ||
		(attachment?.filename && imageExtensions.test(attachment.filename));
	$: isVideo =
		attachment?.content_type?.startsWith('video/') ||
		(attachment?.filename && videoExtensions.test(attachment.filename));
	$: isAudio =
		attachment?.content_type?.startsWith('audio/') ||
		(attachment?.filename && audioExtensions.test(attachment.filename));

	function handleReattach() {
		// ✅ MODIFIED: Dispatch the attachment object along with its resolved URL.
		dispatch('reattach', { ...attachment, url });
	}
</script>

<!-- Renders only if we have a valid attachment object -->
{#if attachment}
	<!-- Case 1: Previews are ENABLED in settings and we have a valid URL -->
	{#if $settingsStore.showFilePreviews && url}
		{#if isImage}
			<div class="group relative rounded-2xl overflow-hidden border border-foreground/10 shadow-sm">
				<img src={url} alt={attachment.filename} class="w-full h-auto object-cover" />
				<div
					class="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
				>
					<button
						on:click={handleReattach}
						class="flex h-8 w-8 items-center justify-center rounded-full bg-background/70 backdrop-blur-sm hover:bg-background"
						aria-label="Re-attach file"><Reply class="w-4 h-4" /></button
					>
					<button
						on:click={() => dispatch('download', attachment)}
						class="flex h-8 w-8 items-center justify-center rounded-full bg-background/70 backdrop-blur-sm hover:bg-background"
						aria-label="Download file"><Download class="w-4 h-4" /></button
					>
				</div>
			</div>
		{:else if isVideo}
			<video {src} controls class="w-full rounded-2xl border border-foreground/10" />
		{:else if isAudio}
			<audio {src} controls class="w-full" />
		{:else}
			<div
				class="flex items-center gap-3 rounded-xl border bg-muted/50 border-foreground/10 p-2.5 text-sm"
			>
				<FileText class="w-5 h-5 flex-shrink-0 text-primary" />
				<div class="flex-1 min-w-0">
					<p class="truncate font-medium">{attachment.filename}</p>
					<p class="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
				</div>
				<button
					on:click={handleReattach}
					class="p-1 rounded-md hover:bg-black/10 flex-shrink-0"
					aria-label="Re-attach file"><Reply class="w-4 h-4" /></button
				>
				<button
					on:click={() => dispatch('download', attachment)}
					class="p-1 rounded-md hover:bg-black/10 flex-shrink-0"
					aria-label="Download file"><Download class="w-4 h-4" /></button
				>
			</div>
		{/if}
		<!-- Case 2: Previews are DISABLED or URL is not yet available -->
	{:else}
		<div
			class="flex items-center gap-3 rounded-xl border bg-muted/50 border-foreground/10 p-2.5 text-sm"
		>
			{#if isImage}<FileText class="w-5 h-5 flex-shrink-0 text-primary" />{:else if isVideo}<Film class="w-5 h-5 flex-shrink-0 text-primary" />{:else if isAudio}<Music class="w-5 h-5 flex-shrink-0 text-primary" />{:else}<FileText class="w-5 h-5 flex-shrink-0 text-primary" />{/if}
			<div class="flex-1 min-w-0">
				<p class="truncate font-medium">{attachment.filename}</p>
				<p class="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
			</div>
			<div class="flex flex-shrink-0">
				<button
					on:click={handleReattach}
					class="p-1 rounded-md hover:bg-black/10"
					aria-label="Re-attach file"><Reply class="w-4 h-4" /></button
				>
				<button
					on:click={() => dispatch('download', attachment)}
					class="p-1 rounded-md hover:bg-black/10"
					aria-label="Download file"><Download class="w-4 h-4" /></button
				>
			</div>
		</div>
	{/if}
{/if}