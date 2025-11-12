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
    let isLoading = false;
    let videoElement: HTMLVideoElement;

    function forward(event: CustomEvent) {
        dispatch(event.type, event.detail);
    }

    async function loadAndPlay() {
        if (isLoading || videoUrl) return;
        isLoading = true;
        try {
            videoUrl = await getPresignedUrl(attachment.file_id);
        } catch (e) {
            console.error("Could not load video.", e);
        } finally {
            isLoading = false;
        }
    }

    onMount(() => {
        if (!isReadOnly) {
            loadAndPlay();
        }
    });
</script>

<div
    class="group relative w-full overflow-hidden rounded-xl border border-border bg-black shadow-sm"
>
    <!-- ✅ FIX: The 'aspect-video' class is crucial. It reserves a 16:9 space
         for the video, preventing any layout shift when the video loads. The
         'w-full' ensures it fills the parent's width. -->
    <div class="aspect-video w-full">
        {#if videoUrl}
            <video
                bind:this={videoElement}
                src={videoUrl}
                controls
                preload="metadata"
                autoplay
                class="block h-full w-full"
            />
        {:else}
            <!-- This placeholder fills the same 16:9 space. -->
            <button
                on:click={loadAndPlay}
                disabled={isLoading}
                class="flex h-full w-full cursor-pointer items-center justify-center bg-muted/20 transition-colors hover:bg-muted/30"
                aria-label="Play video"
            >
                <div
                    class="flex h-16 w-16 items-center justify-center rounded-full bg-black/50 text-white shadow-lg backdrop-blur-sm transition-transform group-hover:scale-110"
                >
                    {#if isLoading}
                        <Loader2 class="h-8 w-8 animate-spin" />
                    {:else}
                        <Play class="ml-1 h-8 w-8" />
                    {/if}
                </div>
            </button>
        {/if}
    </div>

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
