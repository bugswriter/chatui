<!-- src/lib/components/ArchivesModal.svelte -->
<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { historyStore } from "$lib/stores/historyStore";
    import { fade, fly } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import {
        Plus,
        Loader2,
        Archive,
        X,
        MessageSquareText,
    } from "lucide-svelte";

    export let isOpen = false;

    const dispatch = createEventDispatcher();

    function closeModal() {
        dispatch("close");
    }

    function handleSelectSession(sessionId: string) {
        historyStore.selectSession(sessionId);
        closeModal();
    }

    function handleNewChat() {
        historyStore.createNewSession();
        closeModal();
    }

    function handleKeydown(event: KeyboardEvent) {
        if (isOpen && event.key === "Escape") {
            closeModal();
        }
    }

    function formatTimestamp(dateString: string): string {
        const date = new Date(dateString);
        const now = new Date();
        const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        const diffDays = Math.floor(diffSeconds / 86400);

        if (diffDays > 30) return date.toLocaleDateString();
        if (diffDays > 1) return `${diffDays} days ago`;
        if (diffDays === 1) return "Yesterday";

        const diffHours = Math.floor(diffSeconds / 3600);
        if (diffHours >= 1) return `${diffHours}h ago`;

        const diffMinutes = Math.floor(diffSeconds / 60);
        if (diffMinutes >= 1) return `${diffMinutes}m ago`;

        return "Just now";
    }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
    <!-- Backdrop: UNIFIED DESIGN - Light backdrop -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div
        on:click={closeModal}
        transition:fade={{ duration: 150 }}
        class="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm"
        aria-hidden="true"
    ></div>

    <!-- Modal Dialog: UNIFIED DESIGN - Light card aesthetic -->
    <div
        transition:fly={{ duration: 250, y: 20, easing: quintOut }}
        class="fixed top-1/2 left-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2"
        role="dialog"
        aria-modal="true"
        aria-labelledby="archives-title"
    >
        <div
            class="flex max-h-[85vh] flex-col rounded-2xl border border-gray-200 bg-white text-gray-900 shadow-2xl"
        >
            <!-- Header -->
            <header
                class="flex flex-shrink-0 items-center justify-between border-b border-gray-100 p-4"
            >
                <div class="flex items-center gap-3">
                    <Archive class="h-5 w-5 text-gray-500" />
                    <h2 id="archives-title" class="text-lg font-semibold">
                        Chat Archives
                    </h2>
                </div>
                <div class="flex items-center gap-2">
                    <!-- New Chat Button: UNIFIED DESIGN - Standard primary blue -->
                    <button
                        on:click={handleNewChat}
                        class="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    >
                        <Plus class="h-4 w-4" />
                        <span>New Chat</span>
                    </button>
                    <!-- Close Button: UNIFIED DESIGN - Standard gray hover -->
                    <button
                        on:click={closeModal}
                        class="rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                        aria-label="Close archives"
                    >
                        <X class="h-5 w-5" />
                    </button>
                </div>
            </header>

            <!-- Scrollable Content -->
            <div class="min-h-0 flex-1 overflow-y-auto p-2">
                {#if $historyStore.isLoading && $historyStore.sessions.length === 0}
                    <div
                        class="flex flex-col items-center justify-center p-12 text-center text-sm text-gray-500"
                    >
                        <Loader2
                            class="mb-3 h-6 w-6 animate-spin text-blue-500"
                        />
                        <p class="font-medium">Loading Archives...</p>
                        <p class="mt-1 text-xs">
                            Fetching your past conversations.
                        </p>
                    </div>
                {:else if $historyStore.error}
                    <div
                        class="flex flex-col items-center justify-center p-12 text-center text-sm text-red-600"
                    >
                        <MessageSquareText class="mb-3 h-6 w-6" />
                        <p class="font-medium">Could not load history</p>
                        <p class="mt-1 text-xs">{$historyStore.error}</p>
                    </div>
                {:else if $historyStore.sessions.length === 0}
                    <div class="p-12 text-center text-gray-500">
                        <Archive class="mx-auto mb-4 h-10 w-10 text-gray-300" />
                        <p class="font-semibold">No Conversations Yet</p>
                        <p class="mt-1 text-sm">
                            Your chat history will appear here.
                        </p>
                    </div>
                {:else}
                    <ul class="space-y-1 p-2">
                        {#each $historyStore.sessions as session (session.session_id)}
                            <li>
                                <button
                                    on:click={() =>
                                        handleSelectSession(session.session_id)}
                                    class="w-full rounded-lg p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                                    class:bg-blue-50={$historyStore.selectedSessionId ===
                                        session.session_id}
                                    class:hover:bg-gray-50={$historyStore.selectedSessionId !==
                                        session.session_id}
                                    title={session.first_message_preview}
                                >
                                    <p
                                        class="truncate font-medium text-gray-900"
                                    >
                                        {session.first_message_preview}
                                    </p>
                                    <p
                                        class="mt-1.5 text-xs text-gray-500"
                                    >
                                        {formatTimestamp(session.created_at)}
                                        <span class="mx-1.5">&middot;</span>
                                        {session.message_count} messages
                                    </p>
                                </button>
                            </li>
                        {/each}
                    </ul>
                {/if}
            </div>
        </div>
    </div>
{/if}
