<!-- src/routes/+page.svelte -->
<script lang="ts">
    import { authStore } from "$lib/stores/authStore";
    import { chatStore } from "$lib/stores/chatStore";
    import { historyStore } from "$lib/stores/historyStore";
    import { streamChat } from "$lib/services/chat";
    import type { Attachment } from "$lib/types";

    import ChatHistory from "$lib/components/ChatHistory.svelte";
    import ChatInput from "$lib/components/ChatInput.svelte";
    import ArchivesModal from "$lib/components/ArchivesModal.svelte";
    // ✅ Import ImageLightbox if you use it for fullscreen images
    // import ImageLightbox from '$lib/components/ImageLightbox.svelte';

    import { MessageSquarePlus } from "lucide-svelte";

    let isArchivesOpen = false;
    let fullscreenImageUrl: string | null = null;
    let reattachedFiles: Attachment[] = [];

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

    // ✅ REMOVED: handleRequestLogin is no longer needed here.

    async function handleSendMessage(
        event: CustomEvent<{ message: string; attachments: Attachment[] }>,
    ) {
        // Auth check is now inside ChatInput, but an extra check here is good for safety.
        if (!$authStore.isAuthenticated) {
            console.error("Cannot send message. User not authenticated.");
            return;
        }

        const { message, attachments } = event.detail;
        const isNewSession = !$chatStore.sessionId;

        chatStore.sendMessage(message, attachments);
        reattachedFiles = [];

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

    $: isStreaming = $chatStore.activeStreams.size > 0;
</script>

<div class="relative h-full bg-background text-gray-900">
    <ChatHistory
        className="h-full overflow-y-auto pb-48 pt-6"
        messages={$chatStore.messages}
        isLoading={$chatStore.isLoading}
        userName={$authStore.user?.name || "You"}
        userAvatarUrl={$authStore.user?.avatar}
        on:reattach={handleReattach}
        on:viewImage={handleViewImage}
    />

    <div class="absolute bottom-0 left-0 z-10 w-full">
        {#if $historyStore.selectedSessionId === null}
            <!-- ✅ REMOVED: on:requestLogin is no longer needed -->
            <ChatInput
                isLoading={$chatStore.isLoading}
                {isStreaming}
                {reattachedFiles}
                on:send={handleSendMessage}
                on:removeReattached={handleRemoveReattached}
            />
        {:else}
            <div
                class="border-t border-gray-200 bg-white/80 p-4 backdrop-blur-md"
            >
                <div
                    class="mx-auto flex max-w-3xl flex-col items-center gap-3 text-center"
                >
                    <p class="font-medium text-gray-500">
                        This is a read-only view of a past conversation.
                    </p>
                    <button
                        on:click={() => historyStore.createNewSession()}
                        class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                    >
                        <MessageSquarePlus class="h-4 w-4" />
                        Start a New Chat
                    </button>
                </div>
            </div>
        {/if}
    </div>
</div>

<ArchivesModal bind:isOpen={isArchivesOpen} />
