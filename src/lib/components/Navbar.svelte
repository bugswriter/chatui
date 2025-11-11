<!-- src/lib/components/Navbar.svelte -->
<script lang="ts">
    import { createEventDispatcher, onMount, onDestroy } from "svelte";
    import { authStore } from "$lib/stores/authStore";
    import { uiStore } from "$lib/stores/uiStore";
    import { Archive, LayoutDashboard, LogOut, Moon, Sun } from "lucide-svelte";
    import { browser } from "$app/environment"; // ✅ IMPORT `browser`

    import CoinDisplay from "./CoinDisplay.svelte";
    import HistoryPopover from "$lib/components/HistoryPopover.svelte";
    import type { UserDetails } from "$lib/services/auth";

    export let isAuthenticated: boolean;
    export let user: UserDetails | null;
    export let currentTheme: "light" | "dark";

    const dispatch = createEventDispatcher();

    let isDropdownOpen = false;
    let dropdownContainer: HTMLElement;
    let isHistoryOpen = false;
    let historyContainer: HTMLDivElement;

    function toggleDropdown() {
        isDropdownOpen = !isDropdownOpen;
    }
    function closeDropdown() {
        if (isDropdownOpen) isDropdownOpen = false;
    }
    function handleLogout() {
        authStore.logout();
        closeDropdown();
    }

    const handleClickOutside = (event: MouseEvent) => {
        if (
            dropdownContainer &&
            !dropdownContainer.contains(event.target as Node)
        )
            closeDropdown();
        if (
            historyContainer &&
            !historyContainer.contains(event.target as Node)
        )
            isHistoryOpen = false;
    };

    // ✅ THIS IS THE FIX.
    // The onMount lifecycle function is GUARANTEED to run only in the browser.
    // We move the event listener registration and cleanup inside it.
    onMount(() => {
        document.addEventListener("click", handleClickOutside, true);

        // The function returned from onMount is the cleanup function (equivalent to onDestroy)
        return () => {
            document.removeEventListener("click", handleClickOutside, true);
        };
    });
</script>

<header
    class="fixed top-0 left-0 z-50 w-full bg-background/80 backdrop-blur-lg"
>
    <nav class="flex h-14 items-center justify-between px-4">
        <!-- Left Side (Unchanged) -->
        <div class="flex items-center gap-6">
            <a
                href="/"
                class="text-lg font-bold tracking-tighter text-foreground transition-opacity hover:opacity-80"
            >
                bw.ai
            </a>
            <div class="hidden items-center gap-5 md:flex">
                <a
                    href="/pricing"
                    class="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >pricing</a
                >
                <a
                    href="/agents"
                    class="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >agents</a
                >
                <a
                    href="/about"
                    class="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >about</a
                >
            </div>
        </div>

        <!-- Right Side (Unchanged from previous correct version) -->
        <div class="flex items-center gap-2">
            <button
                on:click={() => dispatch("toggle")}
                class="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Toggle theme"
            >
                {#if currentTheme === "dark"}
                    <Sun class="h-4 w-4" />
                {:else}
                    <Moon class="h-4 w-4" />
                {/if}
            </button>

            {#if isAuthenticated && user}
                <div class="hidden sm:flex">
                    <CoinDisplay coins={user.coins} />
                </div>
                <div class="relative" bind:this={dropdownContainer}>
                    <button
                        on:click={toggleDropdown}
                        class="flex h-8 w-8 items-center justify-center rounded-full bg-muted ring-offset-2 ring-offset-background transition-all hover:ring-2 hover:ring-ring"
                        aria-label="Open user menu"
                    >
                        {#if user.avatar}
                            <img
                                src={user.avatar}
                                alt="User Avatar"
                                class="h-full w-full rounded-full object-cover"
                            />
                        {:else}
                            <span
                                class="text-sm font-semibold uppercase text-muted-foreground"
                                >{user.name.charAt(0)}</span
                            >
                        {/if}
                    </button>

                    {#if isDropdownOpen}
                        <div
                            class="absolute top-full right-0 mt-2 w-56 origin-top-right rounded-xl border bg-popover shadow-lg"
                        >
                            <div class="border-b p-2">
                                <div class="rounded-lg bg-muted px-3 py-2">
                                    <p
                                        class="truncate text-sm font-semibold text-popover-foreground"
                                    >
                                        {user.name}
                                    </p>
                                    <p
                                        class="truncate text-xs text-muted-foreground"
                                    >
                                        {user.email}
                                    </p>
                                </div>
                            </div>
                            <div class="p-2">
                                <a
                                    href="/dashboard"
                                    on:click={closeDropdown}
                                    class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-popover-foreground transition-colors hover:bg-muted"
                                >
                                    <LayoutDashboard class="h-4 w-4" />
                                    <span>Dashboard</span>
                                </a>
                                <div
                                    class="relative"
                                    bind:this={historyContainer}
                                >
                                    <button
                                        on:click={() =>
                                            (isHistoryOpen = !isHistoryOpen)}
                                        class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-popover-foreground transition-colors hover:bg-muted"
                                        class:bg-muted={isHistoryOpen}
                                        aria-haspopup="true"
                                        aria-expanded={isHistoryOpen}
                                    >
                                        <Archive class="h-4 w-4" />
                                        <span>Archive</span>
                                    </button>
                                    <HistoryPopover
                                        isOpen={isHistoryOpen}
                                        on:close={() => (isHistoryOpen = false)}
                                    />
                                </div>
                                <button
                                    on:click={handleLogout}
                                    class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-danger transition-colors hover:bg-danger/10"
                                >
                                    <LogOut class="h-4 w-4" />
                                    <span>Logout</span>
                                </button>
                            </div>
                        </div>
                    {/if}
                </div>
            {:else}
                <button
                    on:click={uiStore.openLoginModal}
                    class="flex h-8 items-center justify-center rounded-full px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                    Login
                </button>
                <button
                    on:click={uiStore.openRegisterModal}
                    class="flex h-8 items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                    Register
                </button>
            {/if}
        </div>
    </nav>
</header>
