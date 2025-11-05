<!-- src/lib/components/ArchivesModal.svelte -->
<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { historyStore } from "$lib/stores/historyStore";
    import { fade, scale } from "svelte/transition";
    import {
        Plus,
        Loader2,
        Archive,
        X,
        MessageSquareText,
        AlertTriangle,
    } from "lucide-svelte";
    import clsx from "clsx";

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
        const diffDays = Math.floor(
            (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (diffDays > 30) return date.toLocaleDateString();
        if (diffDays > 1) return `${diffDays} days ago`;
        if (diffDays === 1) return "Yesterday";

        return date.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
        });
    }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
    <!-- Backdrop -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div
        on:click={closeModal}
        transition:fade={{ duration: 150 }}
        class="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
        aria-hidden="true"
    />

    <!-- Modal Dialog -->
    <div
        transition:scale={{ duration: 200, start: 0.95 }}
        class="fixed top-1/2 left-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2"
        role="dialog"
        aria-modal="true"
        aria-labelledby="archives-title"
    >
        <div
            class="flex max-h-[80vh] flex-col rounded-xl border border-border bg-background text-foreground shadow-2xl"
        >
            <!-- Header -->
            <header
                class="flex flex-shrink-0 items-center justify-between border-b border-border p-4"
            >
                <div class="flex items-center gap-3">
                    <Archive class="h-5 w-5 text-muted-foreground" />
                    <h2
                        id="archives-title"
                        class="text-lg font-semibold text-foreground"
                    >
                        Chat Archives
                    </h2>
                </div>
                <div class="flex items-center gap-2">
                    <button
                        on:click={handleNewChat}
                        class="inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        <Plus class="h-4 w-4" />
                        <span>New</span>
                    </button>
                    <button
                        on:click={closeModal}
                        class="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
                        class="flex flex-col items-center justify-center p-12 text-center text-sm text-muted-foreground"
                    >
                        <Loader2
                            class="mb-3 h-6 w-6 animate-spin text-primary"
                        />
                        <p class="font-medium">Loading Archives...</p>
                        <p class="mt-1 text-xs">
                            Fetching your past conversations.
                        </p>
                    </div>
                {:else if $historyStore.error}
                    <div
                        class="flex flex-col items-center justify-center p-12 text-center text-sm text-danger"
                    >
                        <AlertTriangle class="mb-3 h-6 w-6" />
                        <p class="font-medium">Could not load history</p>
                        <p class="mt-1 text-xs">{$historyStore.error}</p>
                    </div>
                {:else if $historyStore.sessions.length === 0}
                    <div class="p-12 text-center text-muted-foreground">
                        <MessageSquareText
                            class="mx-auto mb-4 h-10 w-10 opacity-50"
                        />
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
                                    class={clsx(
                                        "w-full rounded-lg p-3 text-left ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                        $historyStore.selectedSessionId ===
                                            session.session_id
                                            ? "bg-muted"
                                            : "hover:bg-muted/50",
                                    )}
                                    title={session.first_message_preview}
                                >
                                    <p
                                        class="truncate font-medium text-foreground"
                                    >
                                        {session.first_message_preview ||
                                            "Untitled Chat"}
                                    </p>
                                    <p
                                        class="mt-1.5 text-xs text-muted-foreground"
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
