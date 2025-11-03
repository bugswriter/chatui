<!-- src/lib/components/HistoryPopover.svelte -->
<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { historyStore } from "$lib/stores/historyStore";
    import { fly, scale } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import { Plus, Loader2, MessageSquareWarning } from "lucide-svelte";

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

{#if isOpen}
    <!-- UNIFIED DESIGN: Light card popover, standard border/shadow -->
    <div
        transition:scale={{ duration: 150, start: 0.95, easing: quintOut }}
        class="absolute top-full right-0 mt-2 w-80 origin-top-right rounded-xl border border-gray-200 bg-white text-gray-900 shadow-xl focus:outline-none"
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="history-menu-button"
    >
        <!-- Header -->
        <div
            class="flex items-center justify-between border-b border-gray-100 p-3"
        >
            <h3 class="font-semibold">Chat History</h3>
            <!-- New Chat Button: UNIFIED DESIGN - Standard primary blue -->
            <button
                on:click={handleNewChat}
                class="inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                class:text-blue-600={$historyStore.selectedSessionId === null}
                role="menuitem"
            >
                <Plus class="h-4 w-4" />
                <span>New</span>
            </button>
        </div>

        <!-- Scrollable History List -->
        <div
            class="max-h-[24rem] overflow-y-auto p-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-400/30 hover:scrollbar-thumb-gray-400/50"
        >
            {#if $historyStore.isLoading && $historyStore.sessions.length === 0}
                <div
                    class="flex flex-col items-center justify-center p-6 text-center text-sm text-gray-500"
                >
                    <Loader2 class="mb-2 h-5 w-5 animate-spin" />
                    <p>Loading History...</p>
                </div>
            {:else if $historyStore.error}
                <div
                    class="flex flex-col items-center justify-center p-6 text-center text-sm text-red-600"
                >
                    <MessageSquareWarning class="mb-2 h-5 w-5" />
                    <p>{$historyStore.error}</p>
                </div>
            {:else if $historyStore.sessions.length === 0}
                <div class="p-6 text-center text-sm text-gray-500">
                    <p>No past conversations found.</p>
                </div>
            {:else}
                <ul class="space-y-1 p-1">
                    {#each $historyStore.sessions as session (session.session_id)}
                        <li in:fly={{ y: 10, duration: 200, easing: quintOut }}>
                            <!-- Session Button: UNIFIED DESIGN - Standard gray hover/blue selected state -->
                            <button
                                on:click={() =>
                                    handleSelectSession(session.session_id)}
                                class="w-full rounded-lg p-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                                class:bg-gray-100={$historyStore.selectedSessionId ===
                                    session.session_id}
                                class:hover:bg-gray-50={$historyStore.selectedSessionId !==
                                    session.session_id}
                                title={session.first_message_preview}
                                role="menuitem"
                            >
                                <p class="truncate font-medium text-gray-900">
                                    {session.first_message_preview}
                                </p>
                                <p class="mt-1 text-xs text-gray-500">
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
