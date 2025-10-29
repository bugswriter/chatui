<!-- src/lib/components/HistoryPopover.svelte -->
<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { historyStore } from "$lib/stores/historyStore";
    import { fly, scale } from "svelte/transition";
    import { quintOut } from "svelte/easing";

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
        return "Today";
    }
</script>

{#if isOpen}
    <div
        transition:scale={{ duration: 150, start: 0.95, easing: quintOut }}
        class="absolute top-full right-0 mt-2 w-72 origin-top-right rounded-md border border-border bg-background-alt p-1 text-sm shadow-lg"
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="history-menu-button"
    >
        <!-- Header / New Chat Button -->
        <div class="p-1">
            <button
                on:click={handleNewChat}
                class="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 font-medium transition-colors hover:bg-muted"
                class:text-primary={$historyStore.selectedSessionId === null}
                role="menuitem"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="lucide lucide-plus"
                    ><path d="M5 12h14" /><path d="M12 5v14" /></svg
                >
                <span>Start New Chat</span>
            </button>
        </div>

        <div class="my-1 border-b border-border"></div>

        <!-- Scrollable History List -->
        <div
            class="max-h-80 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/30 hover:scrollbar-thumb-muted-foreground/50"
        >
            {#if $historyStore.isLoading && $historyStore.sessions.length === 0}
                <div class="p-4 text-center text-xs text-muted-foreground">
                    Loading...
                </div>
            {:else if $historyStore.error}
                <div class="p-4 text-center text-xs text-destructive">
                    {$historyStore.error}
                </div>
            {:else if $historyStore.sessions.length === 0}
                <div class="p-4 text-center text-xs text-muted-foreground">
                    No history found.
                </div>
            {:else}
                <ul class="space-y-1 p-1">
                    {#each $historyStore.sessions as session (session.session_id)}
                        <li in:fly={{ y: 10, duration: 200, easing: quintOut }}>
                            <button
                                on:click={() =>
                                    handleSelectSession(session.session_id)}
                                class="w-full rounded-sm p-2 text-left transition-colors hover:bg-muted"
                                class:bg-muted={$historyStore.selectedSessionId ===
                                    session.session_id}
                                title={session.first_message_preview}
                                role="menuitem"
                            >
                                <p class="truncate font-medium text-foreground">
                                    {session.first_message_preview}
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
