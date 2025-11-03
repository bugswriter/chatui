<!-- src/lib/components/Navbar.svelte -->
<script lang="ts">
    import { createEventDispatcher, onMount, onDestroy } from "svelte";
    import { authStore } from "$lib/stores/authStore";
    import { LayoutDashboard, LogOut } from "lucide-svelte";

    const dispatch = createEventDispatcher();

    // --- State for the user dropdown ---
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

<header class="w-full bg-transparent text-gray-900">
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
        </div>

        <!-- Right: Auth -->
        <div class="flex items-center gap-4">
            {#if $authStore.isAuthenticated && $authStore.user}
                <!-- Authenticated User View -->
                <div
                    class="flex items-center gap-2 rounded-full border border-gray-200 bg-white/50 px-3 py-1.5 text-sm"
                >
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
                        class="text-amber-500"
                        ><circle cx="12" cy="12" r="10" /><path
                            d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"
                        /><path d="M12 18V6" /></svg
                    >
                    <span class="font-medium text-gray-800"
                        >{Math.round($authStore.user.coins)}</span
                    >
                </div>

                <!-- Avatar & Dropdown Container -->
                <div class="relative" bind:this={dropdownContainer}>
                    <button
                        on:click={toggleDropdown}
                        class="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 ring-2 ring-offset-2 ring-transparent transition-all hover:ring-blue-500/50"
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

                    <!-- Dropdown Menu -->
                    {#if isDropdownOpen}
                        <div
                            class="absolute top-full right-0 mt-2 w-56 origin-top-right rounded-md border border-gray-200 bg-white shadow-lg z-20"
                        >
                            <div class="border-b border-gray-200 px-4 py-3">
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
                                    <span>Money</span>
                                </a>
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
                <button
                    on:click={() => dispatch("openLogin")}
                    class="rounded-full border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 active:scale-[0.98] transition-all"
                >
                    Login
                </button>
                <button
                    on:click={() => dispatch("openRegister")}
                    class="rounded-full bg-blue-500 px-5 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-600 hover:shadow-md active:scale-[0.98]"
                >
                    Register
                </button>
            {/if}
        </div>
    </nav>
</header>
