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
    export let isLazyLoad: boolean = false; // This prop indicates history mode

    const dispatch = createEventDispatcher();

    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i;
    const isImage = (att: Attachment) =>
        att.content_type?.startsWith("image/") ||
        (att.filename && imageExtensions.test(att.filename));
    const videoExtensions = /\.(mp4|webm|mov|mkv|ogg|avi)$/i;
    const isVideo = (att: Attachment) =>
        att.content_type?.startsWith("video/") ||
        (att.filename && videoExtensions.test(att.filename));
    const audioExtensions = /\.(mp3|wav|ogg|m4a|flac)$/i;
    const isAudio = (att: Attachment) =>
        att.content_type?.startsWith("audio/") ||
        (att.filename && audioExtensions.test(att.filename));

    $: imageAttachments = attachments.filter(isImage);
    $: mediaAttachments = attachments.filter(
        (att) => isVideo(att) || isAudio(att),
    );
    $: otherRichAttachments = attachments.filter(
        (att) => !isImage(att) && !isVideo(att) && !isAudio(att),
    );
    $: visibleImages = imageAttachments.slice(0, 4);
    $: isReadOnly = isLazyLoad; // ✅ Create a clearer variable name for passing down

    function forward(event: CustomEvent) {
        dispatch(event.type, event.detail);
    }

    function viewImage(url: string | undefined) {
        if (url) dispatch("viewImage", { url });
    }
</script>

<!-- ✅ This logic for 5+ attachments remains, as requested. -->
{#if attachments.length > 4}
    {#each attachments as attachment (attachment.file_id)}
        <div class="w-full max-w-[480px]">
            <GenericFilePreview
                {attachment}
                {isReadOnly}
                on:reattach={forward}
                on:download={forward}
            />
        </div>
    {/each}
{:else}
    <!-- Image grid logic remains the same, but now passes `isReadOnly` -->
    {#if imageAttachments.length > 1}
        <div class="w-full max-w-[480px]">
            <div
                class="relative overflow-hidden rounded-xl border border-border shadow-sm"
            >
                <div
                    class={clsx("grid gap-0.5", {
                        "grid-cols-2": imageAttachments.length >= 2,
                        "grid-cols-[2fr_1fr]": imageAttachments.length === 3,
                    })}
                >
                    {#each visibleImages as attachment, i (attachment.file_id)}
                        {@const imageUrl = urls[attachment.file_id]}
                        <div
                            class={clsx(
                                "group relative aspect-square bg-muted/30",
                                {
                                    "row-span-2":
                                        imageAttachments.length === 3 &&
                                        i === 0,
                                },
                            )}
                            role="button"
                            tabindex="0"
                            on:click={() => viewImage(imageUrl)}
                        >
                            {#if imageUrl}
                                <img
                                    src={imageUrl}
                                    alt={attachment.filename}
                                    class="h-full w-full object-cover"
                                />
                                <div
                                    class="absolute top-2 right-2 z-10 opacity-0 transition-opacity group-hover:opacity-100"
                                >
                                    <!-- ✅ Pass `isReadOnly` to ActionBar -->
                                    <ActionBar
                                        {attachment}
                                        url={imageUrl}
                                        {isReadOnly}
                                        on:reattach={forward}
                                        on:download={forward}
                                    />
                                </div>
                            {:else}
                                <div
                                    class="h-full w-full animate-pulse bg-muted"
                                ></div>
                            {/if}
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    {:else if imageAttachments.length === 1}
        {@const attachment = imageAttachments[0]}
        {@const imageUrl = urls[attachment.file_id]}
        <div class="w-full max-w-[480px]">
            <div
                class="group relative cursor-pointer overflow-hidden rounded-xl border border-border bg-muted/30"
                role="button"
                tabindex="0"
                on:click={() => viewImage(imageUrl)}
            >
                {#if imageUrl}
                    <img
                        src={imageUrl}
                        alt={attachment.filename}
                        class="block h-auto max-h-[600px] w-full object-contain"
                    />
                    <div
                        class="absolute top-2 right-2 z-10 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                        <!-- ✅ Pass `isReadOnly` to ActionBar -->
                        <ActionBar
                            {attachment}
                            url={imageUrl}
                            {isReadOnly}
                            on:reattach={forward}
                            on:download={forward}
                        />
                    </div>
                {:else}
                    <div
                        class="aspect-video w-full animate-pulse bg-muted"
                    ></div>
                {/if}
            </div>
        </div>
    {/if}

    <!-- ✅ Pass `isReadOnly` to media and generic previews -->
    {#each mediaAttachments as attachment (attachment.file_id)}
        <div class="w-full max-w-[480px]">
            {#if isVideo(attachment)}
                <VideoPreview
                    {attachment}
                    isReadOnly={isLazyLoad}
                    on:reattach={forward}
                    on:download={forward}
                />
            {:else if isAudio(attachment)}
                <AudioPlayer
                    {attachment}
                    isReadOnly={isLazyLoad}
                    on:reattach={forward}
                    on:download={forward}
                />
            {/if}
        </div>
    {/each}

    {#each otherRichAttachments as attachment (attachment.file_id)}
        <div class="w-full max-w-[480px]">
            <GenericFilePreview
                {attachment}
                {isReadOnly}
                on:reattach={forward}
                on:download={forward}
            />
        </div>
    {/each}
{/if}
