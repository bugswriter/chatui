<!-- src/lib/components/auth/LoginModal.svelte -->
<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { fade, fly } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import { authStore } from "$lib/stores/authStore";
    import { X, LogIn, Loader2, AlertCircle } from "lucide-svelte";

    export let isOpen = false;
    const dispatch = createEventDispatcher();

    let email = "";
    let password = "";
    let isLoading = false;
    let error: string | null = null;

    function closeModal() {
        if (!isLoading) isOpen = false;
    }

    function handleSwitchToRegister() {
        dispatch("switchToRegister");
    }

    async function handleSubmit() {
        isLoading = true;
        error = null;
        try {
            await authStore.login(email, password);
            dispatch("success");
        } catch (e) {
            error = e instanceof Error ? e.message : "Login failed.";
        } finally {
            isLoading = false;
        }
    }

    $: if (isOpen) {
        email = "";
        password = "";
        error = null;
        isLoading = false;
    }
</script>

<svelte:window on:keydown={(e) => e.key === "Escape" && closeModal()} />

{#if isOpen}
    <!-- BACKGROUND -->
    <div
        on:click={closeModal}
        transition:fade={{ duration: 200 }}
        class="fixed inset-0 z-40 bg-black"
        aria-hidden="true"
    ></div>

    <!-- MODAL WINDOW -->
    <div
        transition:fly={{ duration: 250, y: 20, easing: quintOut }}
        class="fixed top-1/2 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
    >
        <div
            class="relative rounded-2xl border border-gray-800 bg-[#101010] text-white shadow-[0_0_40px_rgba(255,255,255,0.08)] backdrop-blur-lg"
        >
            <!-- CLOSE BUTTON -->
            <button
                on:click={closeModal}
                class="absolute top-3 right-3 rounded-full p-2 hover:bg-white/10 transition-colors"
                aria-label="Close"
            >
                <X class="h-5 w-5 text-gray-300" />
            </button>

            <!-- HEADER -->
            <div class="p-6 border-b border-gray-800">
                <h2 id="login-title" class="text-xl font-semibold">Sign In</h2>
                <p class="mt-1 text-sm text-gray-400">
                    Access your account to continue.
                </p>
            </div>

            <!-- FORM -->
            <form on:submit|preventDefault={handleSubmit} class="p-6 space-y-5">
                <div>
                    <label
                        for="login-email"
                        class="mb-1.5 block text-sm text-gray-300">Email</label
                    >
                    <input
                        bind:value={email}
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        required
                        disabled={isLoading}
                        class="block w-full rounded-lg border border-gray-700 bg-black/40 px-3 py-2 text-sm text-gray-100 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500/60 placeholder:text-gray-500 disabled:opacity-50"
                    />
                </div>
                <div>
                    <label
                        for="login-password"
                        class="mb-1.5 block text-sm text-gray-300"
                        >Password</label
                    >
                    <input
                        bind:value={password}
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        required
                        disabled={isLoading}
                        class="block w-full rounded-lg border border-gray-700 bg-black/40 px-3 py-2 text-sm text-gray-100 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500/60 placeholder:text-gray-500 disabled:opacity-50"
                    />
                </div>

                {#if error}
                    <div
                        transition:fade={{ duration: 150 }}
                        class="flex items-center gap-2 rounded-md bg-red-500/10 border border-red-500/30 p-2 text-sm text-red-400"
                    >
                        <AlertCircle class="h-4 w-4 flex-shrink-0" />
                        <p>{error}</p>
                    </div>
                {/if}

                <button
                    type="submit"
                    class="mt-3 inline-flex h-10 w-full items-center justify-center rounded-lg bg-white/90 text-black font-semibold text-sm shadow-md transition-all hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50"
                    disabled={isLoading}
                >
                    {#if isLoading}
                        <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                        <span>Signing in...</span>
                    {:else}
                        <LogIn class="mr-2 h-4 w-4" />
                        <span>Sign In</span>
                    {/if}
                </button>
            </form>

            <!-- FOOTER -->
            <div
                class="border-t border-gray-800 px-6 py-4 text-center text-sm text-gray-400"
            >
                Don’t have an account?
                <button
                    on:click={handleSwitchToRegister}
                    class="ml-1 font-semibold text-blue-400 hover:underline focus:outline-none"
                >
                    Sign up
                </button>
            </div>
        </div>
    </div>
{/if}
