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
                waveColor: `${waveColor}40`, // e.g., text-foreground/25
                progressColor: progressColor,
                url: audioUrl,
                barWidth: 3,
                barRadius: 3,
                barGap: 2.5,
                height: 48, // Taller waveform
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
            console.error("Audio player initialization failed:", e);
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

<!-- ✅ REDESIGN: Wider, cleaner audio player with consistent ActionBar overlay -->
<div class="w-full">
    <!-- Filename is now a clean label above the player -->
    <p class="mb-1.5 px-1 text-sm font-medium text-foreground">
        {attachment.filename}
    </p>
    <div
        class="group relative flex w-full items-center gap-3 overflow-hidden rounded-xl border border-border bg-muted p-2 shadow-sm"
    >
        <!-- Play/Pause Button -->
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

        <!-- Waveform and Timestamps -->
        <div class="min-w-0 flex-1">
            {#if hasInitialized}
                <div bind:this={waveContainer} class="w-full" />
                <div class="mt-1 flex items-center gap-2">
                    <span class="font-mono text-xs text-muted-foreground"
                        >{currentTime} / {duration}</span
                    >
                </div>
            {:else}
                <!-- Placeholder to prevent height change -->
                <div class="flex h-[48px] items-center">
                    <span class="text-sm text-muted-foreground"
                        >Click to play audio</span
                    >
                </div>
            {/if}
        </div>

        <!-- Action Bar Overlay -->
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
</div>
