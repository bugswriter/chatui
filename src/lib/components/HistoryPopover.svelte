<!-- src/lib/components/HistoryPopover.svelte -->
<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { historyStore } from "$lib/stores/historyStore";
    import { fly, scale } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import { Plus } from "lucide-svelte";

    export let isOpen = false;

    const dispatch = createEventDispatcher();

    function handleSelectSession(sessionId: string) {
        historyStore.selectSession(sessionId);
        dispatch("close");
    }

    function handleNewChat() {
        historyStore.createNewSession();
        dispatch("close");
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

        // Format as "HH:MM AM/PM"
        return date.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
        });
    }
</script>

{#if isOpen}
    <div
        transition:scale={{ duration: 150, start: 0.95, easing: quintOut }}
        class="absolute top-full right-0 z-20 mt-2 w-72 origin-top-right rounded-xl border border-border bg-background/90 p-1.5 text-sm shadow-xl backdrop-blur-lg"
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="history-menu-button"
    >
        <!-- Header / New Chat Button -->
        <div class="p-1">
            <button
                on:click={handleNewChat}
                class="flex w-full items-center gap-2 rounded-md px-2.5 py-2 font-medium text-foreground transition-colors hover:bg-muted"
                class:bg-muted={$historyStore.selectedSessionId === null}
                role="menuitem"
            >
                <Plus class="h-4 w-4" />
                <span>Start New Chat</span>
            </button>
        </div>

        <hr class="my-1 border-border" />

        <!-- Scrollable History List -->
        <div
            class="max-h-80 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/30 hover:scrollbar-thumb-muted-foreground/50"
        >
            {#if $historyStore.isLoading && $historyStore.sessions.length === 0}
                <div class="p-4 text-center text-xs text-muted-foreground">
                    Loading history...
                </div>
            {:else if $historyStore.error}
                <div class="p-4 text-center text-xs text-danger">
                    {$historyStore.error}
                </div>
            {:else if $historyStore.sessions.length === 0}
                <div class="p-4 text-center text-xs text-muted-foreground">
                    No past conversations.
                </div>
            {:else}
                <ul class="space-y-1 p-1">
                    {#each $historyStore.sessions as session (session.session_id)}
                        <li in:fly={{ y: 10, duration: 200, easing: quintOut }}>
                            <button
                                on:click={() =>
                                    handleSelectSession(session.session_id)}
                                class="w-full rounded-md p-2.5 text-left transition-colors hover:bg-muted"
                                class:bg-muted={$historyStore.selectedSessionId ===
                                    session.session_id}
                                title={session.first_message_preview}
                                role="menuitem"
                            >
                                <p class="truncate font-medium text-foreground">
                                    {session.first_message_preview ||
                                        "Untitled Chat"}
                                </p>
                                <p class="mt-1 text-xs text-muted-foreground">
                                    {formatTimestamp(session.created_at)}
                                </p>
                            </button>
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>
    </div>
{/if}
