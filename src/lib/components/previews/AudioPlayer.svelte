<!-- src/lib/components/previews/AudioPlayer.svelte -->
<script lang="ts">
    import { onDestroy, createEventDispatcher, tick } from "svelte";
    import WaveSurfer from "wavesurfer.js";
    import { Play, Pause, Loader2 } from "lucide-svelte";
    import type { Attachment } from "$lib/types";
    import { getPresignedUrl } from "$lib/services/files";
    import ActionBar from "./ActionBar.svelte";

    export let attachment: Attachment;
    export let isReadOnly: boolean = false;

    const dispatch = createEventDispatcher();

    let waveContainer: HTMLElement;
    let wavesurfer: WaveSurfer | null = null;
    let isPlaying = false;
    let isLoading = false;
    let audioUrl: string | null = null;
    let currentTime = "0:00";
    let duration = "0:00";
    let hasInitialized = false;

    const fakeWaveformHeights = [
        0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.85, 0.9, 0.85,
        0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.25, 0.2, 0.15,
    ];

    function forward(event: CustomEvent) {
        dispatch(event.type, event.detail);
    }

    function formatTime(seconds: number): string {
        if (isNaN(seconds) || seconds === Infinity) return "0:00";
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, "0")}`;
    }

    async function initializePlayer() {
        if (isLoading || hasInitialized) return;
        isLoading = true;
        hasInitialized = true;

        try {
            audioUrl = await getPresignedUrl(attachment.file_id);
            await tick();

            const styles = getComputedStyle(document.documentElement);
            const progressColor = styles
                .getPropertyValue("--color-primary")
                .trim();
            const waveColor = styles
                .getPropertyValue("--color-foreground")
                .trim();

            wavesurfer = WaveSurfer.create({
                container: waveContainer,
                waveColor: `${waveColor}40`,
                progressColor: progressColor,
                url: audioUrl,
                barWidth: 3,
                barRadius: 3,
                barGap: 2.5,
                height: 48,
                cursorWidth: 0,
            });

            wavesurfer.on("ready", () => {
                duration = formatTime(wavesurfer!.getDuration());
                isLoading = false;
                wavesurfer!.play();
            });
            wavesurfer.on("play", () => (isPlaying = true));
            wavesurfer.on("pause", () => (isPlaying = false));
            wavesurfer.on("finish", () => {
                isPlaying = false;
                wavesurfer?.seekTo(0);
            });
            wavesurfer.on(
                "timeupdate",
                (time) => (currentTime = formatTime(time)),
            );
        } catch (e) {
            console.error("Audio player failed:", e);
            isLoading = false;
        }
    }

    function handleTogglePlay() {
        if (!hasInitialized) {
            initializePlayer();
        } else if (wavesurfer) {
            wavesurfer.playPause();
        }
    }

    onDestroy(() => {
        wavesurfer?.destroy();
    });
</script>

<div
    class="group relative flex w-full items-center gap-3 overflow-hidden rounded-xl border border-border bg-muted/50 p-2 shadow-sm"
>
    <button
        on:click={handleTogglePlay}
        disabled={isLoading}
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background shadow-md transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed"
        aria-label={isPlaying ? "Pause" : "Play"}
    >
        {#if isLoading}
            <Loader2 class="h-5 w-5 animate-spin text-primary" />
        {:else if isPlaying}
            <Pause class="h-5 w-5 text-foreground" />
        {:else}
            <Play class="ml-0.5 h-5 w-5 text-foreground" />
        {/if}
    </button>

    <div class="flex min-w-0 flex-1 items-center gap-3">
        {#if hasInitialized}
            <!-- STATE: LOADED & PLAYING -->
            <div class="flex min-h-[48px] w-full items-center gap-3">
                <div bind:this={waveContainer} class="w-full" />
                <div class="shrink-0 font-mono text-xs text-muted-foreground">
                    <span>{currentTime} / {duration}</span>
                </div>
            </div>
        {:else}
            <!-- STATE: ELEGANT "FAKE WAVE" PLACEHOLDER -->
            <div class="flex h-[48px] w-full items-center gap-[2.5px]">
                {#each Array(45) as _, i}
                    <!--
                    ✅ THE VISIBILITY FIX:
                    Using `bg-muted-foreground/30` provides much better contrast
                    against the `bg-muted/50` background in both light and dark modes,
                    making the fake wave clearly visible.
                    -->
                    <div
                        class="w-[3px] rounded-full bg-muted-foreground/30"
                        style="height: {fakeWaveformHeights[
                            i % fakeWaveformHeights.length
                        ] *
                            80 +
                            10}%"
                    ></div>
                {/each}
            </div>
        {/if}
    </div>

    <div
        class="absolute top-2 right-2 z-10 opacity-0 transition-opacity group-hover:opacity-100"
    >
        <ActionBar
            {attachment}
            url={audioUrl}
            {isReadOnly}
            on:reattach={forward}
            on:download={forward}
        />
    </div>
</div>
