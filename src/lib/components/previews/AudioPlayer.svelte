<!-- src/lib/components/previews/AudioPlayer.svelte -->
<script lang="ts">
    import { onDestroy, createEventDispatcher, tick, onMount } from "svelte";
    import WaveSurfer from "wavesurfer.js";
    import { Play, Pause } from "lucide-svelte";
    import type { Attachment } from "$lib/types";
    import { getPresignedUrl } from "$lib/services/files";
    import { formatFileSize } from "$lib/utils";
    import ActionBar from "./ActionBar.svelte";

    export let attachment: Attachment;
    export let isLazyLoad: boolean = false; // The new conditional loading prop

    const dispatch = createEventDispatcher();

    let waveContainer: HTMLElement;
    let wavesurfer: WaveSurfer | null = null;
    let isReady = false;
    let isPlaying = false;
    let isLoadingUrl = false;
    let audioUrl: string | null = null;
    let currentTime = "0:00";
    let duration = "0:00";
    let error: string | null = null;

    function forward(event: CustomEvent) {
        dispatch(event.type, event.detail);
    }
    function formatTime(s: number) {
        const m = Math.floor(s / 60);
        const rs = Math.floor(s % 60);
        return `${m}:${rs.toString().padStart(2, "0")}`;
    }

    async function initializeAndPlay() {
        if (!attachment.file_id || isLoadingUrl) return;
        isLoadingUrl = true;
        error = null;
        try {
            audioUrl = await getPresignedUrl(attachment.file_id);
            await tick();

            const styles = getComputedStyle(document.documentElement);
            const progressColor = styles
                .getPropertyValue("--color-primary")
                .trim();
            const waveColor = styles
                .getPropertyValue("--color-muted-foreground")
                .trim();

            wavesurfer = WaveSurfer.create({
                container: waveContainer,
                waveColor: `${waveColor}40`, // Use theme color with 25% opacity
                progressColor: progressColor,
                url: audioUrl,
                barWidth: 3,
                barRadius: 3,
                barGap: 2.5,
                height: 40,
                cursorWidth: 0,
                barHeight: 1, // ✅ Creates a single, clean wave
            });
            wavesurfer.on("ready", (d) => {
                duration = formatTime(d);
                isReady = true;
                wavesurfer?.play();
            });
            wavesurfer.on("play", () => (isPlaying = true));
            wavesurfer.on("pause", () => (isPlaying = false));
            wavesurfer.on("finish", () => {
                isPlaying = false;
                wavesurfer?.seekTo(0);
            });
            wavesurfer.on(
                "audioprocess",
                (time) => (currentTime = formatTime(time)),
            );
            wavesurfer.on("error", (e) => {
                error = "Could not load audio file.";
                console.error("Wavesurfer error:", e);
            });
        } catch (e) {
            error = "Could not retrieve audio URL.";
            console.error(e);
        } finally {
            isLoadingUrl = false;
        }
    }

    onMount(() => {
        if (!isLazyLoad) {
            initializeAndPlay(); // Eager load for live chat
        }
    });

    function handleTogglePlay() {
        if (wavesurfer && isReady) {
            wavesurfer.playPause();
        } else if (!isLoadingUrl) {
            initializeAndPlay();
        } // Lazy load on click
    }

    onDestroy(() => {
        wavesurfer?.destroy();
    });
</script>

<div
    class="group relative w-full overflow-hidden rounded-xl border border-border bg-muted/50 p-3 shadow-sm"
>
    <div class="flex items-center gap-4">
        <button
            on:click={handleTogglePlay}
            disabled={isLoadingUrl || !!error}
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-background shadow-md transition-colors hover:bg-background/80 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={isPlaying ? "Pause" : "Play"}
        >
            {#if isLoadingUrl}
                <div
                    class="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/50 border-t-foreground"
                />
            {:else if isPlaying}
                <Pause class="h-6 w-6 text-foreground" />
            {:else}
                <Play class="h-6 w-6 ml-1 text-foreground" />
            {/if}
        </button>

        <div class="flex min-h-[48px] min-w-0 flex-1 flex-col justify-center">
            {#if audioUrl}
                <div
                    bind:this={waveContainer}
                    class="h-10 w-full cursor-pointer"
                />
                <div
                    class="mt-1 flex justify-between font-mono text-xs text-muted-foreground"
                >
                    <span>{currentTime}</span>
                    <span>{duration}</span>
                </div>
            {:else}
                <div class="min-w-0 flex-1">
                    <p class="truncate font-semibold text-foreground">
                        {attachment.filename}
                    </p>
                    {#if error}
                        <p class="text-xs text-danger">{error}</p>
                    {:else}
                        <p class="text-xs text-muted-foreground">
                            {formatFileSize(attachment.size)}
                        </p>
                    {/if}
                </div>
            {/if}
        </div>
    </div>

    {#if audioUrl}
        <div
            class="absolute top-2 right-2 z-10 opacity-0 transition-opacity group-hover:opacity-100"
        >
            <ActionBar
                {attachment}
                url={audioUrl}
                on:reattach={forward}
                on:download={forward}
            />
        </div>
    {/if}
</div>
