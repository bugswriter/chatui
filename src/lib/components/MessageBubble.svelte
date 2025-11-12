<!-- src/lib/components/MessageBubble.svelte -->
<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { Info } from "lucide-svelte";
    import type { Message, Attachment } from "$lib/types";
    import { downloadFile, getPresignedUrl } from "$lib/services/files";

    // Import our new, specialized child components from the correct directory
    import MessageAvatar from "./message/MessageAvatar.svelte";
    import MessageContent from "./message/MessageContent.svelte";
    import MessageAttachments from "./message/MessageAttachments.svelte";
    import { chatStore } from "$lib/stores/chatStore";

    export let message: Message;
    export let userName: string = "You";
    export let userAvatarUrl: string | null | undefined = undefined;

    const dispatch = createEventDispatcher();

    let attachmentUrls: Record<string, string> = {};

    $: isUser = message.role === "user";
    $: isSystem = message.role === "system";
    $: displayName = isUser ? userName : message.agent?.name || "Assistant";
    $: isCurrentlyStreaming = $chatStore.activeStreams.has(message.id);

    // Fetch presigned URLs for attachments
    $: {
        if (message.attachments) {
            for (const att of message.attachments) {
                const key = att.file_id;
                if (key && !attachmentUrls[key]) {
                    getPresignedUrl(key)
                        .then((url) => {
                            attachmentUrls = { ...attachmentUrls, [key]: url };
                        })
                        .catch((e) =>
                            console.error(
                                `Failed to fetch temp URL for ${key}:`,
                                e,
                            ),
                        );
                }
            }
        }
    }

    async function handleDownload(event: CustomEvent<Attachment>) {
        try {
            await downloadFile(event.detail);
        } catch (e) {
            console.error("Download failed from MessageBubble:", e);
        }
    }
</script>

{#if isSystem}
    <div
        class="my-4 flex items-center justify-center gap-x-3 text-sm text-muted-foreground"
    >
        <hr class="w-full flex-1" />
        <div class="flex shrink-0 items-center gap-2">
            <Info class="h-4 w-4" />
            <span>{message.content}</span>
        </div>
        <hr class="w-full flex-1" />
    </div>
{:else}
    <div class="flex items-end gap-3" class:flex-row-reverse={isUser}>
        <!-- Component 1: The Avatar -->
        <MessageAvatar
            {isUser}
            {userAvatarUrl}
            {userName}
            agent={message.agent}
        />

        <div
            class="flex max-w-[75%] flex-col gap-2"
            class:items-end={isUser}
            class:items-start={!isUser}
        >
            <p class="px-1 text-xs font-medium text-muted-foreground">
                {displayName}
            </p>

            <!-- Component 2: The Smart Attachment Handler -->
            {#if message.attachments && message.attachments.length > 0}
                <MessageAttachments
                    attachments={message.attachments}
                    urls={attachmentUrls}
                    on:reattach
                    on:download={handleDownload}
                    on:viewImage
                />
            {/if}

            <!-- Component 3: The Text Content Bubble -->
            {#if message.content || isCurrentlyStreaming || message.progress}
                <div class:user-bubble={isUser}>
                    <MessageContent {message} {isUser} {isCurrentlyStreaming} />
                </div>
            {/if}
        </div>
    </div>
{/if}

<!-- ✅ ADDING THE MISSING STYLES BACK -->
<style>
    /* This class is added to the wrapper div for MessageContent */
    .user-bubble :global(.prose .agent-tag) {
        background-color: hsl(var(--primary-foreground) / 0.15);
        color: hsl(var(--primary-foreground));
        border-color: hsl(var(--primary-foreground) / 0.3);
    }
    .user-bubble :global(.prose .agent-tag:hover) {
        background-color: hsl(var(--primary-foreground) / 0.25);
        border-color: hsl(var(--primary-foreground) / 0.4);
    }
</style>
