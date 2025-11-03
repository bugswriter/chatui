<!-- src/lib/components/auth/RegisterModal.svelte -->
<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { fade, fly } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import { authStore } from "$lib/stores/authStore";
    import { X, UserPlus, Loader2, AlertCircle } from "lucide-svelte";

    export let isOpen = false;

    const dispatch = createEventDispatcher();

    let name = "";
    let email = "";
    let password = "";
    let isLoading = false;
    let error: string | null = null;

    function closeModal() {
        if (!isLoading) isOpen = false;
    }

    function handleSwitchToLogin() {
        dispatch("switchToLogin");
    }

    async function handleSubmit() {
        isLoading = true;
        error = null;
        try {
            const successMessage = await authStore.register(
                name,
                email,
                password,
            );
            // Dispatch a success event that the parent component (layout) can handle
            dispatch("success", { message: successMessage });
        } catch (e) {
            error = e instanceof Error ? e.message : "Registration failed.";
        } finally {
            isLoading = false;
        }
    }

    $: if (isOpen) {
        name = "";
        email = "";
        password = "";
        error = null;
        isLoading = false;
    }
</script>

<svelte:window on:keydown={(e) => e.key === "Escape" && closeModal()} />

{#if isOpen}
    <!-- BACKGROUND: UNIFIED DESIGN - Light backdrop -->
    <div
        on:click={closeModal}
        transition:fade={{ duration: 200 }}
        class="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm"
        aria-hidden="true"
    ></div>

    <!-- MODAL WINDOW: UNIFIED DESIGN - Light card aesthetic -->
    <div
        transition:fly={{ duration: 250, y: 20, easing: quintOut }}
        class="fixed top-1/2 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2"
        role="dialog"
        aria-modal="true"
        aria-labelledby="register-title"
    >
        <div
            class="relative rounded-2xl border border-gray-200 bg-white text-gray-900 shadow-2xl"
        >
            <!-- CLOSE BUTTON -->
            <button
                on:click={closeModal}
                class="absolute top-3 right-3 rounded-full p-2 text-gray-500 hover:bg-gray-100 transition-colors"
                aria-label="Close registration form"
            >
                <X class="h-5 w-5" />
            </button>

            <!-- HEADER -->
            <div class="p-6 border-b border-gray-200">
                <h2 id="register-title" class="text-xl font-semibold">
                    Create Account
                </h2>
                <p class="mt-1 text-sm text-gray-500">
                    Join us to get started.
                </p>
            </div>

            <!-- FORM -->
            <form on:submit|preventDefault={handleSubmit} class="p-6 space-y-5">
                <div>
                    <label
                        for="reg-name"
                        class="mb-1.5 block text-sm text-gray-700"
                    >
                        Full Name
                    </label>
                    <!-- INPUT: UNIFIED DESIGN - Light background, subtle border, blue focus ring -->
                    <input
                        bind:value={name}
                        id="reg-name"
                        type="text"
                        placeholder="Bugs Writer"
                        required
                        disabled={isLoading}
                        class="block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 disabled:opacity-50"
                    />
                </div>

                <div>
                    <label
                        for="reg-email"
                        class="mb-1.5 block text-sm text-gray-700"
                    >
                        Email
                    </label>
                    <!-- INPUT: UNIFIED DESIGN - Light background, subtle border, blue focus ring -->
                    <input
                        bind:value={email}
                        id="reg-email"
                        type="email"
                        placeholder="you@example.com"
                        required
                        disabled={isLoading}
                        class="block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 disabled:opacity-50"
                    />
                </div>

                <div>
                    <label
                        for="reg-password"
                        class="mb-1.5 block text-sm text-gray-700"
                    >
                        Password
                    </label>
                    <!-- INPUT: UNIFIED DESIGN - Light background, subtle border, blue focus ring -->
                    <input
                        bind:value={password}
                        id="reg-password"
                        type="password"
                        placeholder="Minimum 8 characters"
                        required
                        minlength="8"
                        disabled={isLoading}
                        class="block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 disabled:opacity-50"
                    />
                </div>

                {#if error}
                    <!-- ERROR MESSAGE: UNIFIED DESIGN - Standard red/danger style -->
                    <div
                        transition:fade={{ duration: 150 }}
                        class="flex items-center gap-2 rounded-md bg-red-50 border border-red-300 p-2 text-sm text-red-600"
                    >
                        <AlertCircle class="h-4 w-4 flex-shrink-0" />
                        <p>{error}</p>
                    </div>
                {/if}

                <!-- PRIMARY BUTTON: UNIFIED DESIGN - Blue -->
                <button
                    type="submit"
                    class="mt-3 inline-flex h-10 w-full items-center justify-center rounded-lg bg-blue-600 text-white font-semibold text-sm shadow-md transition-all hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50"
                    disabled={isLoading}
                >
                    {#if isLoading}
                        <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                        <span>Creating account...</span>
                    {:else}
                        <UserPlus class="mr-2 h-4 w-4" />
                        <span>Sign Up</span>
                    {/if}
                </button>
            </form>

            <!-- FOOTER -->
            <div
                class="border-t border-gray-200 px-6 py-4 text-center text-sm text-gray-500"
            >
                Already have an account?
                <!-- LINK: UNIFIED DESIGN - Standard blue link color -->
                <button
                    on:click={handleSwitchToLogin}
                    class="ml-1 font-semibold text-blue-600 hover:underline focus:outline-none"
                >
                    Sign in
                </button>
            </div>
        </div>
    </div>
{/if}
