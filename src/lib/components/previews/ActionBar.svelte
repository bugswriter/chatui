<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { Download, Reply } from "lucide-svelte";
    import type { Attachment } from "$lib/types";

    export let attachment: Attachment;
    export let url: string | undefined = undefined;

    const dispatch = createEventDispatcher();

    function handleReattach() {
        dispatch("reattach", { ...attachment, url });
    }

    function handleDownload() {
        dispatch("download", attachment);
    }
</script>

<div class="flex items-center justify-end gap-x-2">
    <button
        on:click|stopPropagation={handleReattach}
        class="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
        aria-label="Re-attach file"
    >
        <Reply class="h-4 w-4" />
    </button>
    <button
        on:click|stopPropagation={handleDownload}
        class="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
        aria-label="Download file"
    >
        <Download class="h-4 w-4" />
    </button>
</div>
