<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Download, Reply, FileText, Film, Music } from 'lucide-svelte';
	import type { Attachment } from '$lib/types';
	import { formatFileSize } from '$lib/utils';
	import { settingsStore } from '$lib/stores/settingsStore';

	export let attachment: Attachment;
	export let url: string | undefined = undefined;

	const dispatch = createEventDispatcher();

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
		dispatch('reattach', { ...attachment, url });
	}
</script>

{#if attachment}
	<!-- Case 1: Previews are ENABLED and we have a URL -->
	{#if $settingsStore.showFilePreviews && url}
		{#if isImage}
			<div class="group relative rounded-lg overflow-hidden border border-border shadow-sm">
				<img src={url} alt={attachment.filename} class="w-full h-auto object-cover" />
				<div
					class="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
				>
					<button
						on:click={handleReattach}
						class="flex h-8 w-8 items-center justify-center rounded-full bg-background/70 text-foreground backdrop-blur-sm transition hover:bg-background"
						aria-label="Re-attach file"><Reply class="w-4 h-4" /></button
					>
					<button
						on:click={() => dispatch('download', attachment)}
						class="flex h-8 w-8 items-center justify-center rounded-full bg-background/70 text-foreground backdrop-blur-sm transition hover:bg-background"
						aria-label="Download file"><Download class="w-4 h-4" /></button
					>
				</div>
			</div>
		{:else if isVideo}
			<video {src} controls class="w-full rounded-lg border border-border" />
		{:else if isAudio}
			<audio {src} controls class="w-full" />
		{:else}
			<!-- Generic file preview for when URL is available but not image/video -->
			<div
				class="flex items-center gap-3 rounded-lg border bg-muted/50 border-border p-2.5 text-sm"
			>
				<FileText class="w-5 h-5 flex-shrink-0 text-primary" />
				<div class="flex-1 min-w-0">
					<p class="truncate font-medium text-foreground">{attachment.filename}</p>
					<p class="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
				</div>
				<button
					on:click={handleReattach}
					class="p-1.5 rounded-md text-muted-foreground hover:bg-background hover:text-foreground flex-shrink-0 transition"
					aria-label="Re-attach file"><Reply class="w-4 h-4" /></button
				>
				<button
					on:click={() => dispatch('download', attachment)}
					class="p-1.5 rounded-md text-muted-foreground hover:bg-background hover:text-foreground flex-shrink-0 transition"
					aria-label="Download file"><Download class="w-4 h-4" /></button
				>
			</div>
		{/if}
	<!-- Case 2: Previews are DISABLED or URL is not yet available -->
	{:else}
		<div
			class="flex items-center gap-3 rounded-lg border bg-muted/50 border-border p-2.5 text-sm"
		>
			{#if isImage}<FileText class="w-5 h-5 flex-shrink-0 text-primary" />{:else if isVideo}<Film class="w-5 h-5 flex-shrink-0 text-primary" />{:else if isAudio}<Music class="w-5 h-5 flex-shrink-0 text-primary" />{:else}<FileText class="w-5 h-5 flex-shrink-0 text-primary" />{/if}
			<div class="flex-1 min-w-0">
				<p class="truncate font-medium text-foreground">{attachment.filename}</p>
				<p class="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
			</div>
			<div class="flex flex-shrink-0">
				<button
					on:click={handleReattach}
					class="p-1.5 rounded-md text-muted-foreground hover:bg-background hover:text-foreground transition"
					aria-label="Re-attach file"><Reply class="w-4 h-4" /></button
				>
				<button
					on:click={() => dispatch('download', attachment)}
					class="p-1.5 rounded-md text-muted-foreground hover:bg-background hover:text-foreground transition"
					aria-label="Download file"><Download class="w-4 h-4" /></button
				>
			</div>
		</div>
	{/if}
{/if}