<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { Download, Reply, Loader2 } from "lucide-svelte";
    import type { Attachment } from "$lib/types";

    export let attachment: Attachment;
    export let url: string | undefined = undefined;

    const dispatch = createEventDispatcher();

    let isDownloading = false;

    function handleReattach() {
        dispatch("reattach", { ...attachment, url });
    }

    function handleDownload() {
        if (isDownloading) return;

        isDownloading = true;
        dispatch("download", attachment);

        // Reset the state after a short delay to provide feedback,
        // as we can't know when the browser download is complete.
        setTimeout(() => {
            isDownloading = false;
        }, 2000);
    }
</script>

<div class="flex items-center justify-end gap-x-2">
    <button
        on:click|stopPropagation={handleReattach}
        class="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-all duration-200 ease-in-out hover:scale-110 hover:bg-black/70 active:scale-95"
        aria-label="Re-attach file"
    >
        <Reply class="h-4 w-4" />
    </button>
    <button
        on:click|stopPropagation={handleDownload}
        disabled={isDownloading}
        class="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-all duration-200 ease-in-out hover:scale-110 hover:bg-black/70 active:scale-95 disabled:cursor-not-allowed disabled:scale-100 disabled:opacity-70"
        aria-label="Download file"
    >
        {#if isDownloading}
            <Loader2 class="h-4 w-4 animate-spin" />
        {:else}
            <Download class="h-4 w-4" />
        {/if}
    </button>
</div>
