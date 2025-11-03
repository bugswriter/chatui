<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { goto } from "$app/navigation";
    import { authStore } from "$lib/stores/authStore";
    import { DollarSign, LogOut } from "lucide-svelte";
    import { fly } from "svelte/transition";
    import { quintOut } from "svelte/easing";

    const dispatch = createEventDispatcher();
    let isUserMenuOpen = false;

    function handleLogout() {
        authStore.logout();
        isUserMenuOpen = false;
        goto("/");
    }
</script>

<header
    class="fixed top-0 left-0 z-30 w-full border-b border-border/50 bg-[hsl(var(--bg)/0.7)] backdrop-blur-md transition-all"
>
    <nav
        class="container mx-auto flex h-14 items-center justify-between px-4 md:px-6"
    >
        <!-- Left: Logo & Public Links -->
        <div class="flex items-center gap-8">
            <a
                href="/"
                class="text-lg font-semibold tracking-tight text-[hsl(var(--text))] hover:text-[hsl(var(--color-primary))] transition-colors"
            >
                bugswriter<span class="text-[hsl(var(--color-primary))]"
                    >.ai</span
                >
            </a>
            <div class="hidden md:flex items-center gap-6">
                <a
                    href="/pricing"
                    class="text-sm font-medium text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text))] transition-colors"
                >
                    Pricing
                </a>
                <a
                    href="/agents"
                    class="text-sm font-medium text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text))] transition-colors"
                >
                    Agents
                </a>
            </div>
        </div>

        <!-- Right: Auth & User Menu -->
        <div class="flex items-center gap-2">
            {#if $authStore.isAuthenticated && $authStore.user}
                <a
                    href="/dashboard"
                    class="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-[hsl(var(--color-primary))]/10 px-3 py-1.5 text-sm font-medium text-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-primary))]/20 transition-all"
                >
                    <DollarSign class="h-4 w-4" />
                    Dashboard
                </a>

                <div class="relative">
                    <button
                        on:click={() => (isUserMenuOpen = !isUserMenuOpen)}
                        on:blur={() =>
                            setTimeout(() => (isUserMenuOpen = false), 150)}
                        class="group h-9 w-9 rounded-full ring-2 ring-transparent hover:ring-[hsl(var(--color-primary))]/60 transition-all"
                        aria-label="Open user menu"
                    >
                        <img
                            src={$authStore.user.avatar ||
                                `https://api.dicebear.com/8.x/bottts/svg?seed=${$authStore.user.email}`}
                            alt="User Avatar"
                            class="h-full w-full rounded-full object-cover"
                        />
                    </button>

                    {#if isUserMenuOpen}
                        <div
                            transition:fly={{
                                duration: 150,
                                y: -5,
                                easing: quintOut,
                            }}
                            class="absolute right-0 top-full mt-2 w-52 origin-top-right rounded-xl border border-border/60 bg-[hsl(var(--bg-alt))] p-2 text-sm shadow-lg ring-1 ring-black/5"
                        >
                            <div class="px-2 py-1.5">
                                <p
                                    class="truncate font-semibold text-[hsl(var(--text))]"
                                >
                                    {$authStore.user.name}
                                </p>
                                <p
                                    class="truncate text-xs text-[hsl(var(--text-muted))]"
                                >
                                    {$authStore.user.email}
                                </p>
                            </div>
                            <div class="my-1 border-b border-border/60" />
                            <button
                                on:click={handleLogout}
                                class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-primary))]/10 transition-all"
                            >
                                <LogOut class="h-4 w-4" />
                                <span>Logout</span>
                            </button>
                        </div>
                    {/if}
                </div>
            {:else}
                <button
                    on:click={() => dispatch("openLogin")}
                    class="h-9 rounded-lg px-4 text-sm font-medium text-[hsl(var(--text))] hover:bg-[hsl(var(--color-primary))]/10 hover:text-[hsl(var(--color-primary))] transition-all"
                >
                    Login
                </button>
                <button
                    on:click={() => dispatch("openRegister")}
                    class="h-9 rounded-lg bg-[hsl(var(--color-primary))] px-4 text-sm font-medium text-white shadow-sm hover:bg-[hsl(var(--color-primary-hover))] transition-all"
                >
                    Sign Up
                </button>
            {/if}
        </div>
    </nav>
</header>
