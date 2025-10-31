<!-- src/lib/components/Navbar.svelte -->
<script lang="ts">
    import { createEventDispatcher, onMount, onDestroy } from "svelte";
    import { authStore } from "$lib/stores/authStore";
    import CoinAnimator from "$lib/components/CoinAnimator.svelte";
    import HistoryPopover from "$lib/components/HistoryPopover.svelte";

    const dispatch = createEventDispatcher();

    let isHistoryOpen = false;
    let historyContainer: HTMLDivElement;

    function handleSettingsClick() {
        dispatch("settingsClick");
    }

    // REMOVED: handleLogout function

    function handleClickOutside(event: MouseEvent) {
        if (
            historyContainer &&
            !historyContainer.contains(event.target as Node)
        ) {
            isHistoryOpen = false;
        }
    }

    onMount(() => {
        window.addEventListener("click", handleClickOutside);
    });

    onDestroy(() => {
        window.removeEventListener("click", handleClickOutside);
    });
</script>

<header
    class="fixed top-0 left-0 z-20 flex h-14 w-full items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-sm"
>
    <!-- Left Side -->
    <div class="flex items-center gap-4">
        <h1 class="hidden text-lg font-bold tracking-tight sm:block">
            munni.ai
        </h1>
    </div>

    <!-- Right Side: Shows only if the user is authenticated -->
    {#if $authStore.isAuthenticated && $authStore.user}
        <div class="flex items-center gap-4">
            <div class="rounded-full bg-muted px-3 py-1 text-sm">
                <CoinAnimator coins={$authStore.user.coins} />
            </div>

            <!-- History Popover -->
            <div class="relative" bind:this={historyContainer}>
                <button
                    on:click={() => (isHistoryOpen = !isHistoryOpen)}
                    class="flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    class:bg-muted={isHistoryOpen}
                    aria-haspopup="true"
                    aria-expanded={isHistoryOpen}
                >
                    <span>History</span>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="lucide lucide-chevron-down transition-transform duration-200"
                        class:-rotate-180={isHistoryOpen}
                        ><path d="m6 9 6 6 6-6" /></svg
                    >
                </button>
                <HistoryPopover
                    isOpen={isHistoryOpen}
                    on:close={() => (isHistoryOpen = false)}
                />
            </div>

            <!-- User Avatar & Dropdown -->
            <div class="group relative">
                <button class="h-8 w-8 rounded-full">
                    <img
                        src={$authStore.user.avatar ||
                            `https://api.dicebear.com/8.x/bottts/svg?seed=${$authStore.user.name}`}
                        alt="User Avatar"
                        class="h-full w-full rounded-full object-cover ring-2 ring-transparent group-hover:ring-primary"
                    />
                </button>
                <div
                    class="absolute right-0 top-full mt-2 w-48 origin-top-right scale-95 rounded-md border border-border bg-background-alt p-1 text-sm opacity-0 shadow-lg transition-all duration-100 group-hover:scale-100 group-hover:opacity-100"
                >
                    <div class="px-2 py-1.5 font-semibold text-foreground">
                        {$authStore.user.name}
                    </div>
                    <div class="mb-1 border-b border-border"></div>
                    <button
                        on:click={handleSettingsClick}
                        class="flex w-full items-center gap-2 rounded px-2 py-1.5 transition-colors hover:bg-muted"
                    >
                        <span>Settings</span>
                    </button>
                    <!-- ✅ CHANGED: This is now a standard link to the logout endpoint -->
                    <a
                        href="/logout"
                        class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-destructive transition-colors hover:bg-destructive/10"
                    >
                        <span>Logout</span>
                    </a>
                </div>
            </div>
        </div>
    {/if}
</header>
