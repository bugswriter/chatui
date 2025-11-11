<!-- src/routes/+page.svelte -->
<script lang="ts">
    import { onMount } from "svelte";
    import { authStore } from "$lib/stores/authStore";
    import { chatStore } from "$lib/stores/chatStore";
    import { historyStore } from "$lib/stores/historyStore";
    import { streamChat } from "$lib/services/chat";
    import { createNewSession } from "$lib/services/sessions";
    import { uiStore } from "$lib/stores/uiStore";
    import { get } from "svelte/store";
    import type { Attachment } from "$lib/types";

    import ChatHistory from "$lib/components/ChatHistory.svelte";
    import ChatInput from "$lib/components/ChatInput.svelte";
    import ImageLightbox from "$lib/components/ImageLightbox.svelte";

    // When this page loads, it's always for a new, live chat.
    // We ensure all previous state is cleared.
    onMount(() => {
        chatStore.reset();
        historyStore.clearSelection();
    });

    let fullscreenImageUrl: string | null = null;
    let reattachedFiles: Attachment[] = [];
    let chatContainer: HTMLDivElement;
    let messagesEnd: HTMLDivElement;
    let shouldAutoScroll = true;

    function handleScroll() {
        if (!chatContainer) return;
        const threshold = 50;
        const isAtBottom =
            chatContainer.scrollHeight -
                chatContainer.scrollTop -
                chatContainer.clientHeight <
            threshold;
        shouldAutoScroll = isAtBottom;
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

    // ✅ THIS IS THE NEW, CLEAN, AND ROBUST LOGIC
    async function handleSendMessage(
        event: CustomEvent<{ message: string; attachments: Attachment[] }>,
    ) {
        if (!$authStore.isAuthenticated) {
            uiStore.openLoginModal();
            return;
        }

        const { message, attachments } = event.detail;

        chatStore.sendMessage(message, attachments);
        reattachedFiles = [];
        shouldAutoScroll = true;

        try {
            let sessionId = get(chatStore).sessionId;
            let isFirstMessage = false;

            // If this is the first message, create the session first.
            if (!sessionId) {
                isFirstMessage = true;
                const newSession = await createNewSession();
                sessionId = newSession.session_id;

                // Update the store's state
                chatStore.setSessionId(sessionId);

                // CRUCIAL: Update the URL in place WITHOUT a page reload.
                // This changes the URL from '/' to '/c/{id}' seamlessly.
                history.replaceState(history.state, "", `/c/${sessionId}`);

                // Also update the history store so the sidebar can highlight this new session.
                historyStore.setSelectedSessionId(sessionId, false);
            }

            // Now that we are GUARANTEED to have a valid session ID, send the message.
            await streamChat(
                message,
                sessionId,
                attachments,
                chatStore.handleStreamEvent,
                chatStore.handleStreamFailure,
            );

            // If it was the first message, refresh the history list to show it.
            if (isFirstMessage) {
                historyStore.refreshSessionList();
            }
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "An unknown error occurred.";
            chatStore.handleStreamFailure(errorMessage);
        }
    }

    function handleViewImage(event: CustomEvent<{ url: string }>) {
        fullscreenImageUrl = event.detail.url;
    }

    $: isStreaming = $chatStore.activeStreams.size > 0;

    $: if ($chatStore.messages && messagesEnd) {
        if (shouldAutoScroll) {
            messagesEnd.scrollIntoView({ behavior: "smooth" });
        }
    }
</script>

<!-- This component is now the single source of truth for the live chat UI -->
<div class="relative h-full w-full bg-background text-foreground">
    <div
        class="h-full overflow-y-auto pt-16 pb-32"
        bind:this={chatContainer}
        on:scroll={handleScroll}
    >
        <ChatHistory
            messages={$chatStore.messages}
            isLoading={$chatStore.isLoading}
            userName={$authStore.user?.name || "You"}
            userAvatarUrl={$authStore.user?.avatar}
            on:reattach={handleReattach}
            on:viewImage={handleViewImage}
        />
        <div bind:this={messagesEnd}></div>
    </div>

    <div class="fixed bottom-0 left-0 right-0 pb-4">
        <!-- This ChatInput is ALWAYS for a live chat, never a historical one. -->
        <ChatInput
            isLoading={$chatStore.isLoading}
            {isStreaming}
            {reattachedFiles}
            on:send={handleSendMessage}
            on:removeReattached={handleRemoveReattached}
        />
    </div>
</div>

<ImageLightbox
    url={fullscreenImageUrl}
    on:close={() => (fullscreenImageUrl = null)}
/>
