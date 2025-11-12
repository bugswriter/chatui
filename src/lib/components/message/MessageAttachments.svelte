<!-- src/lib/components/message/MessageAttachments.svelte -->
<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { Attachment } from "$lib/types";
    import clsx from "clsx";
    import VideoPreview from "$lib/components/previews/VideoPreview.svelte";
    import AudioPlayer from "$lib/components/previews/AudioPlayer.svelte";
    import GenericFilePreview from "$lib/components/previews/GenericFilePreview.svelte";
    import ActionBar from "$lib/components/previews/ActionBar.svelte";

    export let attachments: Attachment[] = [];
    export let urls: Record<string, string> = {};

    const dispatch = createEventDispatcher();
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i;
    const videoExtensions = /\.(mp4|webm|mov|mkv|ogg|avi)$/i;
    const audioExtensions = /\.(mp3|wav|ogg|m4a|flac)$/i;
    const isImage = (att: Attachment) =>
        att.content_type?.startsWith("image/") ||
        (att.filename && imageExtensions.test(att.filename));
    const isVideo = (att: Attachment) =>
        att.content_type?.startsWith("video/") ||
        (att.filename && videoExtensions.test(att.filename));
    const isAudio = (att: Attachment) =>
        att.content_type?.startsWith("audio/") ||
        (att.filename && audioExtensions.test(att.filename));

    $: imageAttachments = attachments.filter(isImage);
    $: mediaAttachments = attachments.filter(
        (att) => isVideo(att) || isAudio(att),
    );
    $: otherAttachments = attachments.filter(
        (att) => !isImage(att) && !isVideo(att) && !isAudio(att),
    );

    const MAX_VISIBLE_IMAGES = 4;
    $: visibleImages = imageAttachments.slice(0, MAX_VISIBLE_IMAGES);
    $: hiddenImageCount = imageAttachments.length - MAX_VISIBLE_IMAGES;

    function forward(event: CustomEvent) {
        dispatch(event.type, event.detail);
    }
    function viewImage(url: string | undefined) {
        if (url) dispatch("viewImage", { url });
    }
</script>

<!-- ✅ UI FIX: All attachment containers now share a consistent max-width -->

<!-- Image Groups -->
{#if imageAttachments.length > 1}
    <div
        class="relative w-full max-w-md overflow-hidden rounded-xl border border-border shadow-sm"
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
                {@const imageUrl = urls[attachment.file_id]}
                {@const isLastVisible =
                    i === MAX_VISIBLE_IMAGES - 1 && hiddenImageCount > 0}
                <div
                    class={clsx("group relative aspect-square bg-muted/30", {
                        "row-span-2": imageAttachments.length === 3 && i === 0,
                    })}
                    role="button"
                    tabindex="0"
                    on:click={() => viewImage(imageUrl)}
                >
                    {#if imageUrl}
                        <img
                            src={imageUrl}
                            alt={attachment.filename}
                            class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div
                            class="absolute inset-0 z-10 flex items-end justify-end bg-black/40 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                            <ActionBar
                                {attachment}
                                url={imageUrl}
                                on:reattach={forward}
                                on:download={forward}
                            />
                        </div>
                    {:else}
                        <div class="h-full w-full animate-pulse bg-muted"></div>
                    {/if}
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
{:else if imageAttachments.length === 1}
    {@const attachment = imageAttachments[0]}
    {@const imageUrl = urls[attachment.file_id]}
    <div
        class="group relative w-full max-w-md cursor-pointer overflow-hidden rounded-xl border border-border bg-muted/30"
        role="button"
        tabindex="0"
        on:click={() => viewImage(imageUrl)}
    >
        {#if imageUrl}
            <img
                src={imageUrl}
                alt={attachment.filename}
                class="block h-auto max-h-[500px] w-full object-contain"
            />
            <div
                class="absolute inset-0 z-10 flex items-end justify-end bg-black/40 p-2 opacity-0 transition-opacity group-hover:opacity-100"
            >
                <ActionBar
                    {attachment}
                    url={imageUrl}
                    on:reattach={forward}
                    on:download={forward}
                />
            </div>
        {:else}
            <div class="aspect-video w-full animate-pulse bg-muted"></div>
        {/if}
    </div>
{/if}

<!-- Media (Audio/Video) -->
{#each mediaAttachments as attachment (attachment.file_id)}
    {#if isVideo(attachment)}
        <VideoPreview
            {attachment}
            on:reattach={forward}
            on:download={forward}
        />
    {:else if isAudio(attachment)}
        <AudioPlayer {attachment} on:reattach={forward} on:download={forward} />
    {/if}
{/each}

<!-- Generic Files -->
{#each otherAttachments as attachment (attachment.file_id)}
    <GenericFilePreview
        {attachment}
        on:reattach={forward}
        on:download={forward}
    />
{/each}
