<!-- src/lib/components/previews/GenericFilePreview.svelte -->
<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { FileText, Film, Music } from "lucide-svelte";
    import type { Attachment } from "$lib/types";
    import { formatFileSize } from "$lib/utils";
    import ActionBar from "./ActionBar.svelte";

    export let attachment: Attachment;
    export let url: string | undefined = undefined;
    export let isReadOnly: boolean = false;

    const dispatch = createEventDispatcher();

    const videoExtensions = /\.(mp4|webm|mov|ogg|avi)$/i;
    const audioExtensions = /\.(mp3|wav|ogg|m4a)$/i;

    $: isVideo =
        attachment?.content_type?.startsWith("video/") ||
        (attachment?.filename && videoExtensions.test(attachment.filename));
    $: isAudio =
        attachment?.content_type?.startsWith("audio/") ||
        (attachment?.filename && audioExtensions.test(attachment.filename));

    function forward(event: CustomEvent) {
        dispatch(event.type, event.detail);
    }
</script>

<!-- ✅ WRAPPER: Added 'relative group' for positioning the action bar -->
<div
    class="group relative overflow-hidden rounded-xl border border-border bg-muted p-2.5 text-sm shadow-sm transition-shadow hover:shadow-md"
>
    <div class="flex items-center gap-3">
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
    </div>

    <!-- ✅ ACTION BAR: Use the consistent, sticker-like action bar -->
    <div
        class="absolute top-2 right-2 z-10 opacity-0 transition-opacity group-hover:opacity-100"
    >
        <ActionBar
            {attachment}
            {isReadOnly}
            on:reattach={forward}
            on:download={forward}
        />
    </div>
</div>
