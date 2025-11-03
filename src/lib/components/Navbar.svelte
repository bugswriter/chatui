<!-- src/lib/components/Navbar.svelte -->
<script lang="ts">
    import { createEventDispatcher, onMount, onDestroy } from "svelte";
    import { authStore } from "$lib/stores/authStore";
    import { LayoutDashboard, LogOut } from "lucide-svelte";
    import CoinDisplay from "./CoinDisplay.svelte"; // Using the standardized coin display
    import HistoryPopover from "$lib/components/HistoryPopover.svelte";

    const dispatch = createEventDispatcher();

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

    // --- Logic to close dropdown when clicking outside ---
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

<!-- UNIFIED DESIGN: Standard light background, no border for 'transparent' on scroll, but clean -->
<header
    class="w-full z-20 bg-background/80 text-gray-900 border-b border-border backdrop-blur-sm"
>
    <nav class="flex h-16 items-center justify-between px-6 sm:px-10">
        <div class="flex items-center gap-8">
            <!-- Logo/Brand -->
            <a
                href="/"
                class="text-xl font-semibold tracking-tight hover:opacity-70 transition-opacity"
            >
                bw.ai
            </a>
            <!-- Nav Links: UNIFIED DESIGN - Standard gray text -->
            <a
                href="/pricing"
                class="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
                Pricing
            </a>
            <a
                href="/about"
                class="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
                About
            </a>
        </div>

        <!-- Right: Auth -->
        <div class="flex items-center gap-4">
            {#if $authStore.isAuthenticated && $authStore.user}
                <!-- Authenticated User View -->
                <!-- Coin Display: UNIFIED DESIGN - Standardized with CoinDisplay component -->
                <div
                    class="flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1.5 text-sm"
                >
                    <CoinDisplay coins={$authStore.user.coins} />
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

                <!-- Avatar & Dropdown Container -->
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

                    <!-- Dropdown Menu: UNIFIED DESIGN - Light card look -->
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
                                <!-- Logout: UNIFIED DESIGN - Standard red/danger style -->
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
                <!-- Unauthenticated View -->
                <!-- Secondary Button: UNIFIED DESIGN - Standard gray/border -->
                <button
                    on:click={() => dispatch("openLogin")}
                    class="rounded-full border border-border px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 active:scale-[0.98] transition-all"
                >
                    Login
                </button>
                <!-- Primary Button: UNIFIED DESIGN - Standard blue -->
                <button
                    on:click={() => dispatch("openRegister")}
                    class="rounded-full bg-primary px-5 py-2 text-sm font-medium text-white shadow-md transition-all hover:bg-primary/80 active:scale-[0.98]"
                >
                    Register
                </button>
            {/if}
        </div>
    </nav>
</header>
