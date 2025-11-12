<!-- src/lib/components/previews/ActionBar.svelte -->
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
        setTimeout(() => {
            isDownloading = false;
        }, 2000);
    }
</script>

<!-- A floating "pill" container with a shadow to give it depth -->
<div
    class="flex items-center justify-end gap-x-1 rounded-full bg-black/60 p-1 text-white shadow-lg backdrop-blur-md"
>
    <button
        on:click|stopPropagation={handleReattach}
        class="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-white/20 active:scale-95"
        aria-label="Re-attach file"
    >
        <Reply class="h-4 w-4" />
    </button>
    <button
        on:click|stopPropagation={handleDownload}
        disabled={isDownloading}
        class="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-white/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
        aria-label="Download file"
    >
        {#if isDownloading}
            <Loader2 class="h-4 w-4 animate-spin" />
        {:else}
            <Download class="h-4 w-4" />
        {/if}
    </button>
</div>
