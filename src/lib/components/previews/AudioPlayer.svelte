<!-- src/lib/components/previews/AudioPlayer.svelte -->
<script lang="ts">
    import { onDestroy, createEventDispatcher } from "svelte";
    import WaveSurfer from "wavesurfer.js";
    import { Play, Pause } from "lucide-svelte";
    import type { Attachment } from "$lib/types";
    import { getPresignedUrl } from "$lib/services/files";
    import ActionBar from "./ActionBar.svelte";

    export let attachment: Attachment;

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

    function formatTime(seconds: number): string {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    }

    async function initializeAndPlay() {
        if (!attachment.file_id || isLoadingUrl) return;
        isLoadingUrl = true;
        error = null;
        try {
            audioUrl = await getPresignedUrl(attachment.file_id);
            const styles = getComputedStyle(document.documentElement);
            const progressColor = styles
                .getPropertyValue("--color-primary")
                .trim();
            const waveColor = styles.getPropertyValue("--color-muted").trim();
            wavesurfer = WaveSurfer.create({
                container: waveContainer,
                waveColor,
                progressColor,
                url: audioUrl,
                barWidth: 3,
                barRadius: 3,
                barGap: 2.5,
                height: 48,
                cursorWidth: 0,
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

    function handleTogglePlay() {
        if (wavesurfer && isReady) {
            wavesurfer.playPause();
        } else if (!isLoadingUrl) {
            initializeAndPlay();
        }
    }

    onDestroy(() => {
        wavesurfer?.destroy();
    });
</script>

<!-- ✅ UI FIX: Set a consistent, larger width -->
<div
    class="group relative w-full max-w-md overflow-hidden rounded-xl border border-border bg-background/50 p-3 shadow-sm transition-shadow hover:shadow-md"
>
    <div class="flex items-center gap-3">
        <button
            on:click={handleTogglePlay}
            disabled={isLoadingUrl || !!error}
            class="z-20 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background text-foreground shadow-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={isPlaying ? "Pause" : "Play"}
        >
            {#if isLoadingUrl}
                <div
                    class="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"
                />
            {:else if isPlaying}
                <Pause class="h-5 w-5" />
            {:else}
                <Play class="h-5 w-5" />
            {/if}
        </button>
        <div class="min-w-0 flex-1">
            {#if error}
                <p class="text-xs text-danger">{error}</p>
            {:else}
                <div
                    bind:this={waveContainer}
                    class="h-12 w-full"
                    class:cursor-pointer={isReady}
                />
                <div
                    class="mt-1 flex justify-between font-mono text-xs text-muted-foreground transition-opacity"
                    class:opacity-0={!isReady}
                >
                    <span>{currentTime}</span>
                    <span>{duration}</span>
                </div>
            {/if}
        </div>
    </div>

    <!-- ✅ UX FIX: Action bar only appears when media is loaded and playable -->
    {#if audioUrl}
        <div
            class="absolute inset-0 z-10 flex items-end justify-end bg-black/40 p-2 opacity-0 transition-opacity group-hover:opacity-100"
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
