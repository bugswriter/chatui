<!-- src/routes/c/[sessionId]/+page.svelte -->
<script lang="ts">
    import { page } from "$app/stores";
    import { onMount } from "svelte";
    import { chatStore } from "$lib/stores/chatStore";
    import { historyStore } from "$lib/stores/historyStore";
    import { getSessionDetails } from "$lib/services/history";
    import { agentStore } from "$lib/stores/agentStore";
    import type { Message } from "$lib/types";
    import { authStore } from "$lib/stores/authStore";
    import { MessageSquarePlus } from "lucide-svelte";

    import ChatHistory from "$lib/components/ChatHistory.svelte";
    import ImageLightbox from "$lib/components/ImageLightbox.svelte";

    let chatContainer: HTMLDivElement;
    let messagesEnd: HTMLDivElement;
    $: sessionId = $page.params.sessionId;

    // ✅ THIS IS THE FIX: The missing variable declaration is now added.
    let fullscreenImageUrl: string | null = null;

    function handleViewImage(event: CustomEvent<{ url: string }>) {
        fullscreenImageUrl = event.detail.url;
    }

    function closeLightbox() {
        fullscreenImageUrl = null;
    }

    $: (async (id) => {
        if (!id) return;
        historyStore.setSelectedSessionId(id, true);
        chatStore.setLoadingState();
        try {
            const sessionDetails = await getSessionDetails(id);
            const transformedMessages: Message[] = sessionDetails.messages.map(
                (apiMsg, index) => {
                    const agent = apiMsg.agent_name
                        ? agentStore.findByName(apiMsg.agent_name)
                        : null;
                    return {
                        id: `hist_${id}_${index}`,
                        clientId: `hist_${id}_${index}`,
                        role: apiMsg.role,
                        content: apiMsg.content,
                        attachments: apiMsg.attachments || [],
                        timestamp: new Date(),
                        agent: agent || null,
                    };
                },
            );
            const lastAgent = transformedMessages
                .slice()
                .reverse()
                .find((m) => m.role === "assistant")?.agent;
            chatStore.loadFromHistory({
                messages: transformedMessages,
                sessionId: sessionDetails.session_id,
                activeAgent: lastAgent || null,
            });
        } catch (e) {
            const error =
                e instanceof Error
                    ? e.message
                    : "Could not load this chat session.";
            console.error(error);
            chatStore.handleStreamFailure(error);
        }
    })(sessionId);
</script>

<div class="relative h-full w-full bg-background text-foreground">
    <div class="h-full overflow-y-auto pt-16 pb-32" bind:this={chatContainer}>
        <ChatHistory
            messages={$chatStore.messages}
            isLoading={$chatStore.isLoading}
            userName={$authStore.user?.name || "You"}
            userAvatarUrl={$authStore.user?.avatar}
            on:viewImage={handleViewImage}
            isLazyLoad={true}
        />
        <div bind:this={messagesEnd}></div>
    </div>

    <div class="fixed bottom-0 left-0 right-0">
        <div
            class="w-full shrink-0 border-t bg-background/80 pb-4 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)] backdrop-blur-lg"
        >
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
        </div>
    </div>
</div>

<ImageLightbox url={fullscreenImageUrl} on:close={closeLightbox} />
