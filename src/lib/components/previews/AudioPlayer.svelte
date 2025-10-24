
<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import WaveSurfer from 'wavesurfer.js';
	import { Play, Pause } from 'lucide-svelte';
	import type { Attachment } from '$lib/types';
	import ActionBar from './ActionBar.svelte';

	export let url: string;
	export let attachment: Attachment;

	const dispatch = createEventDispatcher();

	let waveContainer: HTMLElement;
	let wavesurfer: WaveSurfer | null = null;
	let isReady = false;
	let isPlaying = false;
	let currentTime = '0:00';
	let duration = '0:00';
	let error: string | null = null;

	function forward(event: CustomEvent) {
		dispatch(event.type, event.detail);
	}

	function formatTime(seconds: number): string {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = Math.floor(seconds % 60);
		const paddedSeconds = remainingSeconds.toString().padStart(2, '0');
		return `${minutes}:${paddedSeconds}`;
	}

	function togglePlay() {
		if (wavesurfer && isReady) {
			wavesurfer.playPause();
		}
	}

	onMount(() => {
		if (!waveContainer) return;

		const primaryColor = `hsl(var(--primary))`;
		const mutedColor = `hsl(var(--muted))`;

		wavesurfer = WaveSurfer.create({
			container: waveContainer,
			waveColor: mutedColor,
			progressColor: primaryColor,
			url: url,
			barWidth: 3,
			barRadius: 3,
			barGap: 2,
			height: 48,
			cursorWidth: 0
		});

		wavesurfer.on('ready', (d) => {
			duration = formatTime(d);
			isReady = true;
		});

		wavesurfer.on('play', () => (isPlaying = true));
		wavesurfer.on('pause', () => (isPlaying = false));
		wavesurfer.on('finish', () => {
			isPlaying = false;
			wavesurfer?.seekTo(0);
		});
		wavesurfer.on('audioprocess', (time) => (currentTime = formatTime(time)));
		wavesurfer.on('error', (e) => {
			error = e.toString();
			console.error('Wavesurfer error:', e);
		});
	});

	onDestroy(() => {
		wavesurfer?.destroy();
	});
</script>

<div
	class="group relative flex w-full items-center gap-3 overflow-hidden rounded-lg border bg-muted/50 border-border p-2.5 text-sm shadow-sm"
>
	<!-- Action Bar is now included -->
	<ActionBar {attachment} {url} on:reattach={forward} on:download={forward} />

	<!-- Play/Pause Button -->
	<button
		on:click={togglePlay}
		disabled={!isReady || !!error}
		class="z-20 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-background text-foreground shadow-md transition-colors hover:bg-border disabled:cursor-not-allowed disabled:opacity-50"
		aria-label={isPlaying ? 'Pause' : 'Play'}
	>
		{#if !isReady && !error}
			<div class="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
		{:else if isPlaying}
			<Pause class="h-5 w-5" />
		{:else}
			<Play class="h-5 w-5" />
		{/if}
	</button>

	<!-- Waveform & Time -->
	<div class="flex-1 min-w-0">
		{#if error}
			<p class="text-xs text-danger">Could not load audio file.</p>
		{:else}
			<div bind:this={waveContainer} class="h-12 w-full cursor-pointer" />
			<div
				class="flex justify-end text-xs font-mono text-muted-foreground transition-opacity"
				class:opacity-0={!isReady}
			>
				<span>{currentTime} / {duration}</span>
			</div>
		{/if}
	</div>
</div>