<!-- src/lib/components/previews/VideoPreview.svelte -->
<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import { Play, Loader2 } from "lucide-svelte";
    import type { Attachment } from "$lib/types";
    import { getPresignedUrl } from "$lib/services/files";
    import ActionBar from "./ActionBar.svelte";

    export let attachment: Attachment;
    export let isReadOnly: boolean = false;

    const dispatch = createEventDispatcher();

    let videoUrl: string | null = null;
    let isLoading = true; // Start in loading state
    let hasBeenClicked = false;

    function forward(event: CustomEvent) {
        dispatch(event.type, event.detail);
    }

    onMount(async () => {
        try {
            // Fetch the video URL immediately so it's ready for playback
            videoUrl = await getPresignedUrl(attachment.file_id);
        } catch (e) {
            console.error("Failed to fetch video URL:", e);
        } finally {
            isLoading = false;
        }
    });

    function handleClickToPlay() {
        hasBeenClicked = true;
    }
</script>

<!--
The `aspect-video` container is the key to a stable layout.
It reserves the correct space from the very beginning.
`bg-background` makes it theme-aware (light/dark).
-->
<div
    class="group relative w-full overflow-hidden rounded-xl border border-border bg-background shadow-sm aspect-video"
>
    {#if hasBeenClicked && videoUrl}
        <!-- STATE 2: User has clicked, show the interactive video player -->
        <video
            src={videoUrl}
            controls
            preload="auto"
            autoplay
            class="block h-full w-full"
        />
    {:else}
        <!-- STATE 1: Clean, theme-aware placeholder. NO thumbnail generation. -->
        <button
            on:click={handleClickToPlay}
            disabled={isLoading || !videoUrl}
            class="absolute inset-0 flex h-full w-full cursor-pointer items-center justify-center bg-muted/20"
            aria-label="Play video"
        >
            {#if isLoading}
                <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
            {:else}
                <div
                    class="flex h-16 w-16 items-center justify-center rounded-full bg-background/50 text-foreground shadow-lg backdrop-blur-sm transition-transform group-hover:scale-110"
                >
                    <Play class="ml-1 h-8 w-8" />
                </div>
            {/if}
        </button>
    {/if}

    <div
        class="absolute top-2 right-2 z-20 opacity-0 transition-opacity group-hover:opacity-100"
    >
        <ActionBar
            {attachment}
            url={videoUrl}
            {isReadOnly}
            on:reattach={forward}
            on:download={forward}
        />
    </div>
</div>
