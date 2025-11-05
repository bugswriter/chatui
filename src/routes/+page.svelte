<!-- src/routes/+page.svelte -->
<script lang="ts">
    import { onMount, tick } from "svelte";
    import { authStore } from "$lib/stores/authStore";
    import { chatStore } from "$lib/stores/chatStore";
    import { historyStore } from "$lib/stores/historyStore";
    import { streamChat } from "$lib/services/chat";
    import type { Attachment } from "$lib/types";

    import ChatHistory from "$lib/components/ChatHistory.svelte";
    import ChatInput from "$lib/components/ChatInput.svelte";
    import ArchivesModal from "$lib/components/ArchivesModal.svelte";
    import ImageLightbox from "$lib/components/ImageLightbox.svelte";

    import { MessageSquarePlus } from "lucide-svelte";

    let isArchivesOpen = false;
    let fullscreenImageUrl: string | null = null;
    let reattachedFiles: Attachment[] = [];
    let chatContainer: HTMLDivElement;

    async function scrollToBottom() {
        // Wait for the DOM to update before scrolling
        await tick();
        if (chatContainer) {
            chatContainer.scrollTo({
                top: chatContainer.scrollHeight,
                behavior: "smooth",
            });
        }
    }

    function handleReattach(event: CustomEvent<Attachment>) {
        const newAttachment = event.detail;
        if (
            !reattachedFiles.some(
                (file) => file.s3_key === newAttachment.s3_key,
            )
        ) {
            reattachedFiles = [...reattachedFiles, newAttachment];
        }
    }

    function handleRemoveReattached(event: CustomEvent<{ index: number }>) {
        reattachedFiles = reattachedFiles.filter(
            (_, i) => i !== event.detail.index,
        );
    }

    async function handleSendMessage(
        event: CustomEvent<{ message: string; attachments: Attachment[] }>,
    ) {
        if (!$authStore.isAuthenticated) {
            console.error("Cannot send message. User not authenticated.");
            return;
        }

        const { message, attachments } = event.detail;
        const isNewSession = !$chatStore.sessionId;

        chatStore.sendMessage(message, attachments);
        reattachedFiles = [];

        // Immediately scroll to bottom to show the user's message
        scrollToBottom();

        await streamChat(
            message,
            $chatStore.sessionId,
            attachments,
            chatStore.handleStreamEvent,
            chatStore.handleStreamFailure,
        );

        if (isNewSession) {
            historyStore.refreshSessionList();
        }
    }

    function handleViewImage(event: CustomEvent<{ url: string }>) {
        fullscreenImageUrl = event.detail.url;
    }

    function handleDownload(event: CustomEvent<Attachment>) {
        const attachment = event.detail;
        if (!attachment.url) {
            console.error("No URL available for download.");
            return;
        }
        // Create a temporary link to trigger the download
        const link = document.createElement("a");
        link.href = attachment.url;
        link.download = attachment.filename;
        link.target = "_blank"; // Fallback for some browsers
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    $: isStreaming = $chatStore.activeStreams.size > 0;

    // When new messages arrive, scroll to the bottom.
    $: if ($chatStore.messages) {
        scrollToBottom();
    }
</script>

<div class="flex h-full flex-col bg-background text-foreground">
    <!-- This is the main scrolling area for chat history -->
    <div class="flex-1 overflow-y-auto pt-16" bind:this={chatContainer}>
        <ChatHistory
            messages={$chatStore.messages}
            isLoading={$chatStore.isLoading}
            userName={$authStore.user?.name || "You"}
            userAvatarUrl={$authStore.user?.avatar}
            on:reattach={handleReattach}
            on:viewImage={handleViewImage}
            on:download={handleDownload}
        />
    </div>

    <!-- This container is fixed at the bottom and does not scroll -->
    <div
        class="w-full shrink-0 border-t border-border bg-background/95 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]"
    >
        {#if $historyStore.selectedSessionId === null}
            <ChatInput
                isLoading={$chatStore.isLoading}
                {isStreaming}
                {reattachedFiles}
                on:send={handleSendMessage}
                on:removeReattached={handleRemoveReattached}
            />
        {:else}
            <div
                class="container mx-auto flex flex-col items-center justify-center gap-y-3 px-4 py-4 text-center sm:px-6"
            >
                <p class="text-sm text-muted-foreground">
                    This is a read-only view of a past conversation.
                </p>
                <button
                    on:click={() => historyStore.createNewSession()}
                    class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                    <MessageSquarePlus class="h-4 w-4" />
                    <span>Start a New Chat</span>
                </button>
            </div>
        {/if}
    </div>
</div>

<ArchivesModal bind:isOpen={isArchivesOpen} />

<ImageLightbox
    url={fullscreenImageUrl}
    on:close={() => (fullscreenImageUrl = null)}
/>
