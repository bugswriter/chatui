<!-- src/lib/components/previews/VideoPreview.svelte -->
<script lang="ts">
    import { createEventDispatcher, tick } from "svelte";
    import { Play, Film, AlertTriangle } from "lucide-svelte";
    import type { Attachment } from "$lib/types";
    import { getPresignedUrl } from "$lib/services/files";
    import { formatFileSize } from "$lib/utils";
    import ActionBar from "./ActionBar.svelte";

    export let attachment: Attachment;

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
            // ✅ FIX: Wait for Svelte to create the <video> element in the DOM.
            await tick();
            // ✅ FIX: Now that the element exists, we can reliably play it.
            videoElement
                ?.play()
                .catch((e) =>
                    console.warn("Autoplay was prevented by browser:", e),
                );
        } catch (e) {
            error = "Could not load video.";
            console.error("Failed to get video URL:", e);
        } finally {
            isLoadingUrl = false;
        }
    }
</script>

<!-- ✅ UI FIX: Set a consistent, larger width -->
<div
    class="group relative w-full max-w-md overflow-hidden rounded-xl border border-border bg-muted shadow-sm"
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
            class="relative flex aspect-video w-full cursor-pointer flex-col justify-between p-3"
            on:click={loadAndPlay}
        >
            <div
                class="absolute inset-0 bg-gradient-to-br from-background/50 to-muted"
            ></div>
            <div class="absolute inset-0 bg-black/20"></div>
            <div class="relative z-10 flex items-center gap-2 text-white">
                <Film class="h-5 w-5 flex-shrink-0" />
                <span class="truncate text-sm font-medium drop-shadow-md"
                    >{attachment.filename}</span
                >
            </div>
            <div class="relative z-10 flex items-center justify-center">
                <button
                    disabled={isLoadingUrl}
                    class="flex h-14 w-14 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors group-hover:bg-black/70 disabled:opacity-50"
                    aria-label="Play video"
                >
                    {#if isLoadingUrl}
                        <div
                            class="h-7 w-7 animate-spin rounded-full border-4 border-white/50 border-t-white"
                        />
                    {:else if error}
                        <AlertTriangle class="h-7 w-7 text-danger" />
                    {:else}
                        <Play class="h-7 w-7 ml-1" />
                    {/if}
                </button>
            </div>
            <div class="relative z-10">
                {#if error}
                    <p
                        class="text-center text-xs font-semibold text-danger drop-shadow-md"
                    >
                        {error}
                    </p>
                {:else}
                    <p class="text-xs font-mono text-white/80 drop-shadow-md">
                        {formatFileSize(attachment.size)}
                    </p>
                {/if}
            </div>
        </div>
    {/if}

    <!-- ✅ UX FIX: Action bar only appears when media is loaded and playable -->
    {#if videoUrl}
        <div
            class="absolute inset-0 z-20 flex items-end justify-end bg-black/40 p-2 opacity-0 transition-opacity group-hover:opacity-100"
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
