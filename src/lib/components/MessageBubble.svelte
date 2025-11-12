<!-- src/lib/components/MessageBubble.svelte -->
<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { Info } from "lucide-svelte";
    import type { Message, Attachment } from "$lib/types";
    import { downloadFile } from "$lib/services/files";
    import { chatStore } from "$lib/stores/chatStore";
    import MessageAvatar from "./message/MessageAvatar.svelte";
    import MessageContent from "./message/MessageContent.svelte";
    import MessageAttachments from "./message/MessageAttachments.svelte";

    export let message: Message;
    export let userName: string = "You";
    export let userAvatarUrl: string | null | undefined = undefined;
    export let urls: Record<string, string> = {}; // Receives pre-fetched image URLs

    const dispatch = createEventDispatcher();

    $: isUser = message.role === "user";
    $: isSystem = message.role === "system";
    $: displayName = isUser ? userName : message.agent?.name || "Assistant";
    $: isCurrentlyStreaming = $chatStore.activeStreams.has(message.id);

    async function handleDownload(event: CustomEvent<Attachment>) {
        try {
            await downloadFile(event.detail);
        } catch (e) {
            console.error("Download failed from MessageBubble:", e);
        }
    }

    // This ensures events bubble up correctly.
    function forward(event: CustomEvent) {
        dispatch(event.type, event.detail);
    }
</script>

{#if isSystem}
    <div
        class="my-4 flex items-center justify-center gap-x-3 text-sm text-muted-foreground"
    >
        <hr class="w-full flex-1" />
        <div class="flex shrink-0 items-center gap-2">
            <Info class="h-4 w-4" /><span>{message.content}</span>
        </div>
        <hr class="w-full flex-1" />
    </div>
{:else}
    <div class="flex items-end gap-3" class:flex-row-reverse={isUser}>
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
            {#if message.attachments && message.attachments.length > 0}
                <MessageAttachments
                    attachments={message.attachments}
                    {urls}
                    on:reattach={forward}
                    on:download={handleDownload}
                    on:viewImage={forward}
                />
            {/if}
            {#if message.content || isCurrentlyStreaming || message.progress}
                <div class:user-bubble={isUser}>
                    <MessageContent {message} {isUser} {isCurrentlyStreaming} />
                </div>
            {/if}
        </div>
    </div>
{/if}

<style>
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
