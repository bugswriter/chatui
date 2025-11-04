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

    import { MessageSquarePlus } from "lucide-svelte";

    // --- State for LOCAL modals, belonging ONLY to this page ---
    let isArchivesOpen = false;
    let fullscreenImageUrl: string | null = null;
    let reattachedFiles: Attachment[] = [];

    // --- Chat App Event Handlers ---
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

    // NOTE: This component needs to handle the 'requestLogin' event dispatched by ChatInput
    // when a non-authenticated user tries to send a message.
    function handleRequestLogin() {
        // Dispatch an event up to the layout to open the login modal
        // Since there's no explicit forwarding mechanism here, we'll assume
        // the layout is listening on the window or the user manually opens it.
        // For a clean SvelteKit refactor, this should be handled at the layout level,
        // but for this file, we can log an error or simply trust the ChatInput dispatch.
        console.error("User not authenticated. Please log in.");
        // The ChatInput component's logic already dispatches "requestLogin"
    }

    async function handleSendMessage(
        event: CustomEvent<{ message: string; attachments: Attachment[] }>,
    ) {
        if (!$authStore.isAuthenticated) {
            // This case should be handled by ChatInput dispatching 'requestLogin',
            // but this is the final handler, so we exit if unauthenticated.
            console.error("User must be authenticated to send messages.");
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
        className="h-full overflow-y-auto pb-32 pt-6"
        messages={$chatStore.messages}
        isLoading={$chatStore.isLoading}
        userName={$authStore.user?.name || "You"}
        userAvatarUrl={$authStore.user?.avatar}
        on:reattach={handleReattach}
        on:viewImage={handleViewImage}
        on:requestLogin={handleRequestLogin}
    />

    <!-- The ChatInput area is fixed to the bottom of this page's container -->
    <div class="absolute bottom-0 left-0 z-10 w-full">
        {#if $historyStore.selectedSessionId === null}
            <ChatInput
                isLoading={$chatStore.isLoading}
                {isStreaming}
                {reattachedFiles}
                on:send={handleSendMessage}
                on:removeReattached={handleRemoveReattached}
                on:requestLogin={() =>
                    console.error("Request Login - needs parent handling")}
            />
        {:else}
            <!-- Read-only view message -->
            <!-- UNIFIED DESIGN: Standard light border/background/text -->
            <div
                class="border-t border-gray-200 bg-white/80 p-4 backdrop-blur-md"
            >
                <div
                    class="mx-auto flex max-w-3xl flex-col items-center gap-3 text-center"
                >
                    <p class="font-medium text-gray-500">
                        This is a read-only view of a past conversation.
                    </p>
                    <!-- PRIMARY BUTTON: UNIFIED DESIGN - Standard blue -->
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

{#if fullscreenImageUrl}
    <ImageLightbox
        imageUrl={fullscreenImageUrl}
        on:close={() => (fullscreenImageUrl = null)}
    />
{/if}
