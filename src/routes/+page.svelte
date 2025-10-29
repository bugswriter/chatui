<!-- src/routes/+page.svelte -->
<script lang="ts">
    import { onMount } from "svelte";
    import { authStore } from "$lib/stores/authStore";
    import { chatStore } from "$lib/stores/chatStore";
    import { historyStore } from "$lib/stores/historyStore";
    import { streamChat } from "$lib/services/chat";
    import Navbar from "$lib/components/Navbar.svelte";
    import ChatHistory from "$lib/components/ChatHistory.svelte";
    import ChatInput from "$lib/components/ChatInput.svelte";
    import LoginModal from "$lib/components/LoginModal.svelte";
    import SettingsModal from "$lib/components/SettingsModal.svelte";
    import ImageLightbox from "$lib/components/ImageLightbox.svelte";
    import type { Attachment } from "$lib/types";

    let isLoginOpen = false;
    let isSettingsOpen = false;
    let reattachedFiles: Attachment[] = [];

    let fullscreenImageUrl: string | null = null;

    onMount(() => {
        authStore.initialize();
    });

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

        authStore.refreshUserDetails();
    }

    function handleViewImage(event: CustomEvent<{ url: string }>) {
        fullscreenImageUrl = event.detail.url;
    }

    $: isStreaming = $chatStore.activeStreams.size > 0;
</script>

<!-- Initial Auth Check Loading Spinner -->
{#if $authStore.isLoading}
    <div class="flex h-screen w-full items-center justify-center bg-background">
        <div
            class="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"
        ></div>
    </div>

    <!-- Main Chat App (Authenticated) - SIMPLIFIED LAYOUT -->
{:else if $authStore.isAuthenticated && $authStore.user}
    <div class="h-screen bg-background text-foreground">
        <Navbar on:settingsClick={() => (isSettingsOpen = true)} />
        <main class="relative h-full pt-14">
            <ChatHistory
                className="absolute inset-0 pb-[150px] md:pb-[130px]"
                messages={$chatStore.messages}
                isLoading={$chatStore.isLoading}
                userName={$authStore.user.name}
                userAvatarUrl={$authStore.user.avatar}
                on:reattach={handleReattach}
                on:viewImage={handleViewImage}
            />
            <div class="absolute bottom-0 left-0 z-10 w-full">
                {#if $historyStore.selectedSessionId === null}
                    <!-- Active Chat Input -->
                    <ChatInput
                        isLoading={$chatStore.isLoading}
                        {isStreaming}
                        {reattachedFiles}
                        on:send={handleSendMessage}
                        on:removeReattached={handleRemoveReattached}
                    />
                {:else}
                    <!-- Read-Only Notice for Past Chats -->
                    <div
                        class="border-t border-border bg-background/80 p-4 backdrop-blur-sm"
                    >
                        <div
                            class="mx-auto flex max-w-3xl flex-col items-center gap-3 text-center text-sm"
                        >
                            <p class="font-medium text-muted-foreground">
                                This is a read-only view of a past conversation.
                            </p>
                            <button
                                on:click={() => historyStore.createNewSession()}
                                class="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                            >
                                Start a New Chat
                            </button>
                        </div>
                    </div>
                {/if}
            </div>
        </main>
    </div>

    <!-- Logged-out Landing Page -->
{:else}
    <div
        class="flex h-screen w-full flex-col items-center justify-center bg-background p-4 text-center"
    >
        <h1
            class="bg-gradient-to-br from-primary via-user to-primary bg-clip-text text-6xl font-bold tracking-tighter text-transparent"
        >
            munni.ai
        </h1>
        <p class="mt-4 max-w-md text-lg text-muted-foreground">
            Your intelligent AI assistant, reimagined.
        </p>
        <button
            on:click={() => (isLoginOpen = true)}
            class="mt-8 rounded-full bg-primary py-3 px-8 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:scale-105"
        >
            Login to Continue
        </button>
    </div>
{/if}

<!-- Modals -->
<LoginModal isOpen={isLoginOpen} on:close={() => (isLoginOpen = false)} />
<SettingsModal
    isOpen={isSettingsOpen}
    on:close={() => (isSettingsOpen = false)}
/>

{#if fullscreenImageUrl}
    <ImageLightbox
        imageUrl={fullscreenImageUrl}
        on:close={() => (fullscreenImageUrl = null)}
    />
{/if}
