<!-- src/lib/components/Navbar.svelte -->
<script lang="ts">
    import { onMount, onDestroy } from "svelte"; // ✅ REMOVED: createEventDispatcher
    import { authStore } from "$lib/stores/authStore";
    import { uiStore } from "$lib/stores/uiStore"; // ✅ IMPORT uiStore
    import { LayoutDashboard, LogOut, Archive } from "lucide-svelte";
    import CoinDisplay from "./CoinDisplay.svelte";
    import HistoryPopover from "$lib/components/HistoryPopover.svelte";
    import { page } from "$app/stores";

    $: isActivePage = $page.url.pathname === "/";

    // ✅ REMOVED: const dispatch = createEventDispatcher();

    let isHistoryOpen = false;
    let historyContainer: HTMLDivElement;
    let isDropdownOpen = false;
    let dropdownContainer: HTMLElement;

    function toggleDropdown() {
        isDropdownOpen = !isDropdownOpen;
    }

    function closeDropdown() {
        isDropdownOpen = false;
    }

    function handleLogout() {
        authStore.logout();
        closeDropdown();
    }

    const handleClickOutside = (event: MouseEvent) => {
        if (
            isDropdownOpen &&
            dropdownContainer &&
            !dropdownContainer.contains(event.target as Node)
        ) {
            closeDropdown();
        }
    };

    onMount(() => {
        document.addEventListener("click", handleClickOutside, true);
    });

    onDestroy(() => {
        document.removeEventListener("click", handleClickOutside, true);
    });
</script>

<header
    class="w-full z-20 bg-background/80 text-gray-900 border-b border-border backdrop-blur-sm"
>
    <nav class="flex h-16 items-center justify-between px-6 sm:px-10">
        <div class="flex items-center gap-8">
            <a
                href="/"
                class="text-xl font-semibold tracking-tight hover:opacity-70 transition-opacity"
            >
                bw.ai
            </a>
            <a
                href="/pricing"
                class="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
                Pricing
            </a>
            <a
                href="/agents"
                class="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
                Agents
            </a>
            <a
                href="/about"
                class="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
                About
            </a>
        </div>

        <div class="flex items-center gap-4">
            {#if $authStore.isAuthenticated && $authStore.user}
                <div
                    class="flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1.5 text-sm"
                >
                    <CoinDisplay coins={$authStore.user.coins} />
                </div>
                <div class="relative" bind:this={dropdownContainer}>
                    <button
                        on:click={toggleDropdown}
                        class="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 ring-2 ring-offset-2 ring-transparent transition-all hover:ring-border/50"
                        aria-label="Open user menu"
                    >
                        {#if $authStore.user.avatar}
                            <img
                                src={$authStore.user.avatar}
                                alt="User Avatar"
                                class="h-full w-full rounded-full object-cover"
                            />
                        {:else}
                            <span
                                class="text-sm font-semibold uppercase text-gray-600"
                                >{$authStore.user.name.charAt(0)}</span
                            >
                        {/if}
                    </button>

                    {#if isDropdownOpen}
                        <div
                            class="absolute top-full right-0 mt-2 w-56 origin-top-right rounded-xl border border-border bg-white shadow-lg z-20"
                        >
                            <div class="border-b border-border px-4 py-3">
                                <p class="truncate text-sm font-semibold">
                                    {$authStore.user.name}
                                </p>
                                <p class="truncate text-xs text-gray-500">
                                    {$authStore.user.email}
                                </p>
                            </div>
                            <div class="p-2">
                                <a
                                    href="/dashboard"
                                    on:click={closeDropdown}
                                    class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                >
                                    <LayoutDashboard class="h-4 w-4" />
                                    <span>Dashboard</span>
                                </a>
                                {#if isActivePage}
                                    <div
                                        class="relative"
                                        bind:this={historyContainer}
                                    >
                                        <button
                                            on:click={() =>
                                                (isHistoryOpen =
                                                    !isHistoryOpen)}
                                            class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                            class:bg-muted={isHistoryOpen}
                                            aria-haspopup="true"
                                            aria-expanded={isHistoryOpen}
                                        >
                                            <Archive class="h-5 w-5" />
                                            <span>Archive</span>
                                        </button>
                                        <HistoryPopover
                                            isOpen={isHistoryOpen}
                                            on:close={() =>
                                                (isHistoryOpen = false)}
                                        />
                                    </div>
                                {/if}
                                <button
                                    on:click={handleLogout}
                                    class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                    <LogOut class="h-4 w-4" />
                                    <span>Logout</span>
                                </button>
                            </div>
                        </div>
                    {/if}
                </div>
            {:else}
                <!-- ✅ MODIFIED: Buttons now call uiStore methods directly -->
                <button
                    on:click={uiStore.openLoginModal}
                    class="rounded-full border border-border px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 active:scale-[0.98] transition-all"
                >
                    Login
                </button>
                <button
                    on:click={uiStore.openRegisterModal}
                    class="rounded-full bg-primary px-5 py-2 text-sm font-medium text-white shadow-md transition-all hover:bg-primary/80 active:scale-[0.98]"
                >
                    Register
                </button>
            {/if}
        </div>
    </nav>
</header>
