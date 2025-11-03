<!-- src/lib/components/auth/LoginModal.svelte -->
<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import { fade, fly } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import { authStore } from "$lib/stores/authStore";
    // NOTE: Using a generic icon. Replace with actual Google, GitHub, etc., icons if available in your icon library.
    import {
        X,
        LogIn,
        Loader2,
        AlertCircle,
        ExternalLink,
    } from "lucide-svelte";

    // Define the type for an OAuth provider based on the API response
    type OAuthProvider = {
        name: string;
        display_name: string;
        state: string;
        auth_url: string;
        code_verifier: string;
        code_challenge: string;
        code_challenge_method: string;
    };

    export let isOpen = false;
    const dispatch = createEventDispatcher();

    let email = "";
    let password = "";
    let isLoading = false; // For email/password submission
    let error: string | null = null;

    // NEW STATE FOR OAUTH PROVIDERS
    let providers: OAuthProvider[] = [];
    let isProvidersLoading = false;
    let providersError: string | null = null;

    // A flag to track if we're redirecting for OAuth
    let isOAuthRedirecting = false;

    function closeModal() {
        if (!isLoading && !isOAuthRedirecting) isOpen = false;
    }

    function handleSwitchToRegister() {
        dispatch("switchToRegister");
    }

    function handleSwitchToForgotPassword() {
        dispatch("switchToForgotPassword");
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

    // NEW FUNCTION: Fetch OAuth Providers
    async function fetchProviders() {
        if (providers.length > 0 || isProvidersLoading) return;

        isProvidersLoading = true;
        providersError = null;
        try {
            // Replace with your actual fetch logic (e.g., using SvelteKit's fetch or a client-side fetch)
            const response = await fetch(
                "https://bugswriter.ai/api/v1/auth/oauth2/providers",
            );

            if (!response.ok) {
                throw new Error("Failed to fetch OAuth providers.");
            }

            const data = await response.json();
            providers = data.providers;
        } catch (e) {
            providersError =
                e instanceof Error
                    ? e.message
                    : "Could not load sign-in options.";
            console.error(e);
        } finally {
            isProvidersLoading = false;
        }
    }

    // NEW FUNCTION: Handle OAuth Redirect
    function handleOAuthLogin(authUrl: string) {
        // Set state and redirect. We disable the modal close/other buttons
        // while we wait for the redirect.
        isOAuthRedirecting = true;
        error = null; // Clear general error

        // IMPORTANT: Perform the full page redirect using the pre-generated auth_url
        window.location.href = authUrl;
    }

    // Reactively fetch providers when the modal opens
    $: if (isOpen) {
        email = "";
        password = "";
        error = null;
        isLoading = false;
        isOAuthRedirecting = false; // Reset redirect state on open
        fetchProviders();
    }

    // Alternatively, fetch providers once on mount if they are static
    // onMount(fetchProviders);
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
        aria-labelledby="login-title"
    >
        <div
            class="relative rounded-2xl border border-border bg-background text-accent-foreground shadow-2xl"
        >
            <!-- CLOSE BUTTON -->
            <button
                on:click={closeModal}
                class="absolute top-3 right-3 rounded-full p-2 text-gray-500 hover:bg-gray-100 transition-colors"
                aria-label="Close"
                disabled={isLoading || isOAuthRedirecting}
            >
                <X class="h-5 w-5" />
            </button>

            <!-- HEADER -->
            <div class="p-6 border-b border-gray-200">
                <h2 id="login-title" class="text-xl font-semibold">Sign In</h2>
                <p class="mt-1 text-sm text-gray-500">
                    Access your account to continue.
                </p>
            </div>

            <!-- FORM and OAUTH -->
            <div class="p-6 space-y-5">
                <!-- OAUTH PROVIDERS SECTION -->
                {#if isProvidersLoading}
                    <div
                        class="flex justify-center items-center py-4 text-gray-500"
                    >
                        <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                        <span>Loading sign-in options...</span>
                    </div>
                {:else if providersError}
                    <!-- ERROR MESSAGE for providers -->
                    <div
                        transition:fade={{ duration: 150 }}
                        class="flex items-center gap-2 rounded-md bg-red-50 border border-red-300 p-2 text-sm text-red-600"
                    >
                        <AlertCircle class="h-4 w-4 flex-shrink-0" />
                        <p>{providersError}</p>
                    </div>
                {:else if providers.length > 0}
                    <!-- Dynamic OAuth Buttons -->
                    {#each providers as provider (provider.name)}
                        <button
                            on:click={() => handleOAuthLogin(provider.auth_url)}
                            class="inline-flex h-10 w-full items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 font-semibold text-sm shadow-sm transition-all hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:opacity-50"
                            disabled={isLoading || isOAuthRedirecting}
                        >
                            <!-- Use the display_name for the button text -->
                            <ExternalLink class="mr-2 h-4 w-4" />
                            <span>Sign In with {provider.display_name}</span>
                        </button>
                    {/each}

                    <!-- SEPARATOR -->
                    <div class="relative flex items-center">
                        <div class="flex-grow border-t border-gray-200"></div>
                        <span
                            class="flex-shrink mx-4 text-xs text-gray-400 uppercase"
                            >Or continue with</span
                        >
                        <div class="flex-grow border-t border-gray-200"></div>
                    </div>
                {/if}

                <!-- EMAIL/PASSWORD FORM (remains largely the same) -->
                <form on:submit|preventDefault={handleSubmit} class="space-y-5">
                    <!-- ... email and password inputs ... -->
                    <div>
                        <label
                            for="login-email"
                            class="mb-1.5 block text-sm text-gray-700"
                            >Email</label
                        >
                        <!-- INPUT: UNIFIED DESIGN - Light background, subtle border, blue focus ring -->
                        <input
                            bind:value={email}
                            id="login-email"
                            type="email"
                            placeholder="you@example.com"
                            required
                            disabled={isLoading || isOAuthRedirecting}
                            class="block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 disabled:opacity-50"
                        />
                    </div>
                    <div>
                        <label
                            for="login-password"
                            class="mb-1.5 block text-sm text-gray-700"
                            >Password</label
                        >
                        <!-- INPUT: UNIFIED DESIGN - Light background, subtle border, blue focus ring -->
                        <input
                            bind:value={password}
                            id="login-password"
                            type="password"
                            placeholder="••••••••"
                            required
                            disabled={isLoading || isOAuthRedirecting}
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
                        class="inline-flex h-10 w-full items-center justify-center rounded-lg bg-blue-600 text-white font-semibold text-sm shadow-md transition-all hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50"
                        disabled={isLoading || isOAuthRedirecting}
                    >
                        {#if isLoading || isOAuthRedirecting}
                            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                            <span>
                                {#if isOAuthRedirecting}
                                    Redirecting...
                                {:else}
                                    Signing in...
                                {/if}
                            </span>
                        {:else}
                            <LogIn class="mr-2 h-4 w-4" />
                            <span>Sign In</span>
                        {/if}
                    </button>
                </form>
                <!-- FORGOT PASSWORD LINK SECTION -->
                <div class="flex justify-end pt-1">
                    <button
                        on:click={handleSwitchToForgotPassword}
                        class="text-sm font-semibold text-blue-600 hover:underline focus:outline-none"
                        disabled={isLoading || isOAuthRedirecting}
                    >
                        Forgot Password?
                    </button>
                </div>
            </div>

            <!-- FOOTER -->
            <div
                class="border-t border-gray-200 px-6 py-4 text-center text-sm text-gray-500"
            >
                Don’t have an account?
                <!-- LINK: UNIFIED DESIGN - Standard blue link color -->
                <button
                    on:click={handleSwitchToRegister}
                    class="ml-1 font-semibold text-blue-600 hover:underline focus:outline-none"
                    disabled={isLoading || isOAuthRedirecting}
                >
                    Sign up
                </button>
            </div>
        </div>
    </div>
{/if}
