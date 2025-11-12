<!-- src/lib/components/message/MessageAttachments.svelte -->
<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { Attachment } from "$lib/types";
    import clsx from "clsx";

    // Import the individual "dumb" renderers that this component orchestrates
    import VideoPreview from "$lib/components/previews/VideoPreview.svelte";
    import AudioPlayer from "$lib/components/previews/AudioPlayer.svelte";
    import GenericFilePreview from "$lib/components/previews/GenericFilePreview.svelte";

    export let attachments: Attachment[] = [];
    export let urls: Record<string, string> = {};

    const dispatch = createEventDispatcher();

    // --- Centralized Logic to Separate File Types ---
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i;
    const isImage = (attachment: Attachment) =>
        attachment?.content_type?.startsWith("image/") ||
        (attachment?.filename && imageExtensions.test(attachment.filename));

    $: imageAttachments = attachments.filter(isImage);
    $: otherAttachments = attachments.filter((att) => !isImage(att));

    // --- Image Group Specific Logic ---
    const MAX_VISIBLE_IMAGES = 4;
    $: visibleImages = imageAttachments.slice(0, MAX_VISIBLE_IMAGES);
    $: hiddenImageCount = imageAttachments.length - MAX_VISIBLE_IMAGES;

    // --- Event Forwarding ---
    function forward(event: CustomEvent) {
        dispatch(event.type, event.detail);
    }

    function viewImage(url: string | undefined) {
        if (url) dispatch("viewImage", { url });
    }
</script>

<!-- This single component intelligently handles every attachment case -->

<!-- CASE 1: Multiple Images (Instagram-Style Group) -->
{#if imageAttachments.length > 1}
    <div
        class="relative w-full max-w-sm overflow-hidden rounded-xl border border-border shadow-sm"
    >
        <div
            class={clsx("grid gap-1", {
                "grid-cols-2":
                    imageAttachments.length === 2 ||
                    imageAttachments.length >= 4,
                "grid-cols-[2fr_1fr]": imageAttachments.length === 3,
            })}
        >
            {#each visibleImages as attachment, i (attachment.file_id)}
                {@const isLastVisible =
                    i === MAX_VISIBLE_IMAGES - 1 && hiddenImageCount > 0}
                <div
                    class={clsx(
                        "relative aspect-square cursor-pointer bg-muted/30",
                        {
                            "row-span-2":
                                imageAttachments.length === 3 && i === 0,
                        },
                    )}
                    on:click={() => viewImage(urls[attachment.file_id])}
                    on:keypress={() => viewImage(urls[attachment.file_id])}
                    role="button"
                    tabindex="0"
                    aria-label="View image {attachment.filename}"
                >
                    <!-- Use object-cover to fill the grid space perfectly -->
                    <img
                        src={urls[attachment.file_id]}
                        alt={attachment.filename}
                        class="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                    {#if isLastVisible}
                        <div
                            class="absolute inset-0 flex items-center justify-center bg-black/60"
                        >
                            <span class="text-2xl font-bold text-white"
                                >+{hiddenImageCount}</span
                            >
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    </div>
    <!-- CASE 2: A Single Image (Full View) -->
{:else if imageAttachments.length === 1}
    <div
        class="relative w-full max-w-sm cursor-pointer overflow-hidden rounded-xl border border-border bg-muted/30"
        on:click={() => viewImage(urls[imageAttachments[0].file_id])}
        on:keypress={() => viewImage(urls[imageAttachments[0].file_id])}
        role="button"
        tabindex="0"
        aria-label="View image {imageAttachments[0].filename}"
    >
        <!-- Use object-contain to show the full, un-cropped image -->
        <img
            src={urls[imageAttachments[0].file_id]}
            alt={imageAttachments[0].filename}
            class="block h-auto max-h-96 w-full object-contain"
        />
    </div>
{/if}

<!-- CASE 3: Other File Types (Stacked Vertically) -->
{#each otherAttachments as attachment (attachment.file_id)}
    {@const attachmentUrl = urls[attachment.file_id]}
    {#if attachmentUrl}
        {@const isVideo = attachment.content_type?.startsWith("video/")}
        {@const isAudio = attachment.content_type?.startsWith("audio/")}

        <div class="w-full max-w-sm">
            {#if isVideo}
                <VideoPreview url={attachmentUrl} />
            {:else if isAudio}
                <AudioPlayer
                    {attachment}
                    url={attachmentUrl}
                    on:reattach={forward}
                    on:download={forward}
                />
            {:else}
                <GenericFilePreview
                    {attachment}
                    url={attachmentUrl}
                    on:reattach={forward}
                    on:download={forward}
                />
            {/if}
        </div>
    {/if}
{/each}
