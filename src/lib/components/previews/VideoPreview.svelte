<!-- src/lib/components/previews/VideoPreview.svelte -->
<script lang="ts">
    import { createEventDispatcher, tick, onMount } from "svelte";
    import { Play, Film, AlertTriangle } from "lucide-svelte";
    import type { Attachment } from "$lib/types";
    import { getPresignedUrl } from "$lib/services/files";
    import { formatFileSize } from "$lib/utils";
    import ActionBar from "./ActionBar.svelte";

    export let attachment: Attachment;
    export let isLazyLoad: boolean = false; // The new conditional loading prop

    const dispatch = createEventDispatcher();

    let videoUrl: string | null = null;
    let isLoadingUrl = false;
    let error: string | null = null;
    let videoElement: HTMLVideoElement;

    function forward(event: CustomEvent) {
        dispatch(event.type, event.detail);
    }

    async function loadAndPlay() {
        if (isLoadingUrl || videoUrl) return;
        isLoadingUrl = true;
        error = null;
        try {
            videoUrl = await getPresignedUrl(attachment.file_id);
            await tick();
            if (videoElement) {
                videoElement
                    .play()
                    .catch((e) =>
                        console.warn("Autoplay was prevented by browser:", e),
                    );
            }
        } catch (e) {
            error = "Could not load video.";
            console.error("Failed to get video URL:", e);
        } finally {
            isLoadingUrl = false;
        }
    }

    onMount(() => {
        if (!isLazyLoad) {
            loadAndPlay(); // Eager load for live chat
        }
    });
</script>

<div
    class="group relative w-full overflow-hidden rounded-xl border border-border bg-muted shadow-sm"
>
    {#if videoUrl}
        <video
            bind:this={videoElement}
            src={videoUrl}
            controls
            class="block w-full"
        />
    {:else}
        <div
            class="relative flex aspect-video w-full cursor-pointer flex-col items-center justify-center p-4 text-center"
            on:click={loadAndPlay}
        >
            <button
                disabled={isLoadingUrl}
                class="flex h-16 w-16 items-center justify-center rounded-full bg-background/50 text-foreground shadow-lg backdrop-blur-sm transition-colors hover:bg-background/80"
                aria-label="Play video"
            >
                {#if isLoadingUrl}
                    <div
                        class="h-8 w-8 animate-spin rounded-full border-4 border-muted-foreground/50 border-t-foreground"
                    />
                {:else if error}
                    <AlertTriangle class="h-8 w-8 text-danger" />
                {:else}
                    <Play class="h-8 w-8 ml-1" />
                {/if}
            </button>
            <div class="absolute bottom-4 left-4 right-4 min-w-0">
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
        </div>
    {/if}

    {#if videoUrl}
        <div
            class="absolute top-2 right-2 z-20 opacity-0 transition-opacity group-hover:opacity-100"
        >
            <ActionBar
                {attachment}
                url={videoUrl}
                on:reattach={forward}
                on:download={forward}
            />
        </div>
    {/if}
</div>
