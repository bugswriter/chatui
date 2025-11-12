<!-- src/lib/components/previews/GenericFilePreview.svelte -->
<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import {
        Download,
        Reply,
        FileText,
        Film,
        Music,
        Loader2,
    } from "lucide-svelte";
    import type { Attachment } from "$lib/types";
    import { formatFileSize } from "$lib/utils";

    export let attachment: Attachment;
    export let url: string | undefined = undefined;

    const dispatch = createEventDispatcher();

    let isDownloading = false;

    const videoExtensions = /\.(mp4|webm|mov|ogg|avi)$/i;
    const audioExtensions = /\.(mp3|wav|ogg|m4a)$/i;

    $: isVideo =
        attachment?.content_type?.startsWith("video/") ||
        (attachment?.filename && videoExtensions.test(attachment.filename));
    $: isAudio =
        attachment?.content_type?.startsWith("audio/") ||
        (attachment?.filename && audioExtensions.test(attachment.filename));

    function handleReattach() {
        dispatch("reattach", { ...attachment, url });
    }

    function handleDownload() {
        if (isDownloading) return;
        isDownloading = true;
        dispatch("download", attachment);
        setTimeout(() => {
            isDownloading = false;
        }, 2000);
    }
</script>

<div
    class="flex items-center gap-3 rounded-xl border border-border bg-muted p-2.5 text-sm transition-shadow hover:shadow-md"
>
    <!-- Icon -->
    <div
        class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-background"
    >
        {#if isVideo}
            <Film class="h-5 w-5 text-muted-foreground" />
        {:else if isAudio}
            <Music class="h-5 w-5 text-muted-foreground" />
        {:else}
            <FileText class="h-5 w-5 text-muted-foreground" />
        {/if}
    </div>

    <!-- File Info -->
    <div class="min-w-0 flex-1">
        <p class="truncate font-medium text-foreground">
            {attachment.filename}
        </p>
        <p class="text-xs text-muted-foreground">
            {formatFileSize(attachment.size)}
        </p>
    </div>

    <!-- Action Buttons -->
    <div class="flex flex-shrink-0 items-center gap-1">
        <button
            on:click={handleReattach}
            class="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-all duration-200 ease-in-out hover:bg-background hover:text-foreground hover:scale-110 active:scale-95"
            aria-label="Re-attach file"
        >
            <Reply class="h-4 w-4" />
        </button>
        <button
            on:click={handleDownload}
            disabled={isDownloading}
            class="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-all duration-200 ease-in-out hover:bg-background hover:text-foreground hover:scale-110 active:scale-95 disabled:cursor-not-allowed disabled:scale-100 disabled:bg-transparent"
            aria-label="Download file"
        >
            {#if isDownloading}
                <Loader2 class="h-4 w-4 animate-spin" />
            {:else}
                <Download class="h-4 w-4" />
            {/if}
        </button>
    </div>
</div>
