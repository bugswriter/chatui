<script lang="ts">
    import { authStore } from "$lib/stores/authStore";
    import { chatStore } from "$lib/stores/chatStore";
    import { historyStore } from "$lib/stores/historyStore";
    import { streamChat } from "$lib/services/chat";
    import type { Attachment } from "$lib/types";

    // --- Chat-Specific Component Imports ---
    // Navbar and global modals are now handled by the root layout.
    import ChatHistory from "$lib/components/ChatHistory.svelte";
    import ChatInput from "$lib/components/ChatInput.svelte";
    import ImageLightbox from "$lib/components/ImageLightbox.svelte";
    import ArchivesModal from "$lib/components/Archives.svelte";
    // You would also create and import ChatSettingsModal and ChatHeader here.

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

    async function handleSendMessage(
        event: CustomEvent<{ message: string; attachments: Attachment[] }>,
    ) {
        // The ChatInput component should handle prompting the user to log in.
        // This is a final safeguard.
        if (!$authStore.isAuthenticated) {
            console.error("User must be authenticated to send messages.");
            // In a real app, you might dispatch an event to the layout to open the login modal here.
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

<!--
  This div's height is calculated to be the full viewport height minus the navbar's height.
  This ensures the page content perfectly fills the remaining space.
-->
<div class="relative h-[calc(100vh-3.5rem)] bg-background text-foreground">
    <!--
    The ChatHistory component will show the welcome screen if messages are empty.
    It needs padding-bottom to ensure the last message isn't hidden by the fixed ChatInput.
  -->
    <ChatHistory
        className="h-full overflow-y-auto pb-32 pt-6"
        messages={$chatStore.messages}
        isLoading={$chatStore.isLoading}
        userName={$authStore.user?.name || "You"}
        userAvatarUrl={$authStore.user?.avatar}
        on:reattach={handleReattach}
        on:viewImage={handleViewImage}
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
            />
        {:else}
            <!-- This appears when viewing a past conversation from the archives -->
            <div
                class="border-t border-border bg-background/80 p-4 backdrop-blur-md"
            >
                <div
                    class="mx-auto flex max-w-3xl flex-col items-center gap-3 text-center"
                >
                    <p class="font-medium text-muted-foreground">
                        This is a read-only view of a past conversation.
                    </p>
                    <button
                        on:click={() => historyStore.createNewSession()}
                        class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                    >
                        <MessageSquarePlus class="h-4 w-4" />
                        Start a New Chat
                    </button>
                </div>
            </div>
        {/if}
    </div>
</div>

<!--
  PAGE-SPECIFIC MODALS
  These are only rendered when the user is on the chat page.
-->
<ArchivesModal bind:isOpen={isArchivesOpen} />

{#if fullscreenImageUrl}
    <ImageLightbox
        imageUrl={fullscreenImageUrl}
        on:close={() => (fullscreenImageUrl = null)}
    />
{/if}
