<!-- src/lib/components/ChatHistory.svelte -->
<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { getPresignedUrl } from "$lib/services/files";
    import type { Message } from "$lib/types";
    import MessageBubble from "./MessageBubble.svelte";
    import LoadingMessage from "./LoadingMessage.svelte";

    export let messages: Message[] = [];
    export let isLoading: boolean = false;
    export let userName: string = "You";
    export let userAvatarUrl: string | null | undefined = undefined;
    export let isLazyLoad: boolean = false; // ✅ Receive the prop

    const dispatch = createEventDispatcher();
    let imageUrls: Record<string, string> = {};

    $: (async (currentMessages) => {
        if (!currentMessages || currentMessages.length === 0) {
            imageUrls = {};
            return;
        }
        const promises: Promise<void>[] = [];
        const newUrls: Record<string, string> = {};
        for (const msg of currentMessages) {
            if (msg.attachments) {
                for (const att of msg.attachments) {
                    const isImage =
                        att.content_type?.startsWith("image/") ||
                        att.filename?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
                    if (isImage && att.file_id && !imageUrls[att.file_id]) {
                        const promise = getPresignedUrl(att.file_id)
                            .then((url) => {
                                newUrls[att.file_id] = url;
                            })
                            .catch((e) => {
                                console.error(
                                    `Failed to get URL for ${att.file_id}:`,
                                    e,
                                );
                            });
                        promises.push(promise);
                    }
                }
            }
        }
        if (promises.length > 0) {
            await Promise.all(promises);
            imageUrls = { ...imageUrls, ...newUrls };
        }
    })(messages);

    function forward(event: CustomEvent) {
        dispatch(event.type, event.detail);
    }
</script>

<div class="h-full overflow-y-auto px-4">
    <div class="container mx-auto max-w-3xl py-6">
        {#if messages.length === 0 && !isLoading}
            <div
                class="flex h-full flex-col items-center justify-center py-24 text-center"
            >
                <img
                    src="https://media.tenor.com/Jwq3k63p73sAAAAj/manidhaya.gif"
                    alt="Assistant animation"
                    class="w-36"
                />
                <h1
                    class="mt-6 text-4xl font-semibold tracking-tight text-foreground"
                >
                    Cherry Blossom
                </h1>
                <p class="mt-2 max-w-sm text-muted-foreground">
                    Start a conversation by typing a message below, or upload a
                    file to begin.
                </p>
            </div>
        {:else}
            <div class="flex flex-col gap-y-6">
                {#each messages as message (message.clientId || message.id)}
                    <MessageBubble
                        {message}
                        {userName}
                        {userAvatarUrl}
                        urls={imageUrls}
                        {isLazyLoad}
                        on:reattach={forward}
                        on:viewImage={forward}
                    />
                {/each}
                {#if isLoading}
                    <div class="flex justify-start"><LoadingMessage /></div>
                {/if}
            </div>
        {/if}
    </div>
</div>
