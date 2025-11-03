<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Attachment } from '$lib/types';
	import { settingsStore } from '$lib/stores/settingsStore';

	import ImagePreview from './previews/ImagePreview.svelte';
	import VideoPreview from './previews/VideoPreview.svelte';
	import AudioPlayer from './previews/AudioPlayer.svelte';
	import GenericFilePreview from './previews/GenericFilePreview.svelte';

	export let attachment: Attachment;
	export let url: string | undefined = undefined;

	const dispatch = createEventDispatcher();

	function forward(event: CustomEvent) {
		dispatch(event.type, event.detail);
	}

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
</script>

{#if attachment}
	<!-- UNIFIED DESIGN: The internal preview components enforce consistency -->
	{#if $settingsStore.showFilePreviews && url}
		{#if isImage}
			<ImagePreview
				{attachment}
				{url}
				on:viewImage={forward}
				on:contentLoaded={forward}
				on:reattach={forward}
				on:download={forward}
			/>
		{:else if isVideo}
			<VideoPreview {attachment} {url} on:reattach={forward} on:download={forward} />
		{:else if isAudio}
			<AudioPlayer {attachment} {url} on:reattach={forward} on:download={forward} />
		{:else}
			<GenericFilePreview {attachment} {url} on:reattach={forward} on:download={forward} />
		{/if}
	{:else}
		<GenericFilePreview {attachment} {url} on:reattach={forward} on:download={forward} />
	{/if}
{/if}
