<!-- src/routes/+page.svelte -->
<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { authStore } from "$lib/stores/authStore";
    import { chatStore } from "$lib/stores/chatStore";
    import { historyStore } from "$lib/stores/historyStore";
    import { streamChat } from "$lib/services/chat";
    import { createNewSession } from "$lib/services/sessions";
    import { uiStore } from "$lib/stores/uiStore";
    import { get } from "svelte/store";
    import type { Attachment } from "$lib/types";
    import { ChevronDown } from "lucide-svelte";
    import { fade } from "svelte/transition";

    import ChatHistory from "$lib/components/ChatHistory.svelte";
    import ChatInput from "$lib/components/ChatInput.svelte";
    import ImageLightbox from "$lib/components/ImageLightbox.svelte";

    let chatContainer: HTMLDivElement;
    let messagesEnd: HTMLDivElement;
    let observer: MutationObserver;

    let shouldAutoScroll = true;

    onMount(() => {
        chatStore.reset();
        historyStore.clearSelection();

        const scrollToBottom = (behavior: "smooth" | "auto" = "smooth") => {
            messagesEnd?.scrollIntoView({ behavior });
        };

        observer = new MutationObserver(() => {
            if (shouldAutoScroll) {
                scrollToBottom();
            }
        });

        observer.observe(chatContainer, {
            childList: true,
            subtree: true,
        });

        scrollToBottom("auto");

        return () => {
            if (observer) observer.disconnect();
        };
    });

    function handleScroll() {
        if (!chatContainer) return;
        const threshold = 100;
        shouldAutoScroll =
            chatContainer.scrollHeight -
                chatContainer.scrollTop -
                chatContainer.clientHeight <
            threshold;
    }

    async function handleSendMessage(
        event: CustomEvent<{ message: string; attachments: Attachment[] }>,
    ) {
        if (!$authStore.isAuthenticated) {
            uiStore.openLoginModal();
            return;
        }

        shouldAutoScroll = true;

        const { message, attachments } = event.detail;

        chatStore.sendMessage(message, attachments);

        try {
            let sessionId = get(chatStore).sessionId;
            let isFirstMessage = !sessionId;

            if (isFirstMessage) {
                const newSession = await createNewSession();
                sessionId = newSession.session_id;

                chatStore.setSessionId(sessionId);
                history.replaceState(history.state, "", `/c/${sessionId}`);
                historyStore.setSelectedSessionId(sessionId, false);
            }

            await streamChat(
                message,
                sessionId!,
                attachments,
                chatStore.handleStreamEvent,
                chatStore.handleStreamFailure,
            );

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

    // --- Unchanged Helper Functions ---
    let fullscreenImageUrl: string | null = null;
    let reattachedFiles: Attachment[] = [];
    function handleReattach(event: CustomEvent<Attachment>) {
        if (
            !reattachedFiles.some((file) => file.s3_key === event.detail.s3_key)
        ) {
            reattachedFiles = [...reattachedFiles, event.detail];
        }
    }
    function handleRemoveReattached(event: CustomEvent<{ index: number }>) {
        reattachedFiles = reattachedFiles.filter(
            (_, i) => i !== event.detail.index,
        );
    }
    function handleViewImage(event: CustomEvent<{ url: string }>) {
        fullscreenImageUrl = event.detail.url;
    }
    $: isStreaming = $chatStore.activeStreams.size > 0;
</script>

<div class="relative h-full w-full bg-background text-foreground">
    <!--
      ✅ SCROLL-FIX: The scroll container itself has no bottom padding.
      This ensures its `scrollHeight` is calculated correctly.
    -->
    <div
        class="h-full overflow-y-auto pt-16"
        bind:this={chatContainer}
        on:scroll={handleScroll}
    >
        <!-- ✅ SCROLL-FIX: An inner div now provides the bottom padding (safe area)
             for the fixed input, without interfering with scroll calculations. -->
        <div class="pb-32">
            <ChatHistory
                messages={$chatStore.messages}
                isLoading={$chatStore.isLoading}
                userName={$authStore.user?.name || "You"}
                userAvatarUrl={$authStore.user?.avatar}
                on:reattach={handleReattach}
                on:viewImage={handleViewImage}
            />
            <div bind:this={messagesEnd} class="h-0"></div>
        </div>
    </div>

    {#if !shouldAutoScroll}
        <div
            class="absolute bottom-32 right-0 left-0 flex justify-center"
            transition:fade={{ duration: 200 }}
        >
            <button
                on:click={() =>
                    messagesEnd?.scrollIntoView({ behavior: "smooth" })}
                class="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background shadow-lg transition-all hover:scale-110 hover:shadow-xl active:scale-95"
                aria-label="Scroll to bottom"
            >
                <ChevronDown class="h-5 w-5 text-muted-foreground" />
            </button>
        </div>
    {/if}

    <!--
      ✅ GLASSY-FIX: The parent container for the input now has the backdrop-blur effect.
      The ChatInput component itself will have a transparent background.
    -->
    <div
        class="fixed bottom-0 left-0 right-0 bg-background/80 pb-4 backdrop-blur-lg"
    >
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
