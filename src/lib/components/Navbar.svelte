<!-- src/lib/components/Navbar.svelte -->
<script lang="ts">
    import { createEventDispatcher } from "svelte"; // ADD THIS
    import { authStore } from "$lib/stores/authStore";

    const dispatch = createEventDispatcher(); // ADD THIS
</script>

<header class="w-full border-b border-gray-800 bg-gray-950 text-white">
    <nav class="container mx-auto flex h-14 items-center justify-between px-4">
        <!-- Left: Branding + Links -->
        <div class="flex items-center gap-6">
            <a href="/" class="text-lg font-semibold hover:text-blue-400">
                bw<span class="text-blue-400">.ai</span>
            </a>
            <a href="/pricing" class="text-sm hover:text-blue-400">Pricing</a>
        </div>

        <!-- Right: Auth -->
        <div class="flex items-center gap-3">
            {#if $authStore.isAuthenticated}
                <a
                    href="/dashboard"
                    class="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium hover:bg-blue-700"
                >
                    Dashboard
                </a>
            {:else}
                <!-- CHANGE: This is now a button that dispatches an event -->
                <button
                    on:click={() => dispatch("openLogin")}
                    class="text-sm px-3 py-1.5 hover:text-blue-400"
                >
                    Login
                </button>
                <!-- CHANGE: This is now a button that dispatches an event -->
                <button
                    on:click={() => dispatch("openRegister")}
                    class="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium hover:bg-blue-700"
                >
                    Register
                </button>
            {/if}
        </div>
    </nav>
</header>
