<!-- src/lib/components/auth/RegisterModal.svelte -->
<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { fade, fly } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import { authStore } from "$lib/stores/authStore";
    // IMPORT CHANGE: Adding ExternalLink and type definition for OAuth flow
    import {
        X,
        UserPlus,
        Loader2,
        AlertCircle,
        ExternalLink,
    } from "lucide-svelte";

    // Define the type for an OAuth provider (copied from LoginModal)
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

    let name = "";
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

    // NEW FUNCTION: Fetch OAuth Providers (copied from LoginModal)
    async function fetchProviders() {
        if (providers.length > 0 || isProvidersLoading) return;

        isProvidersLoading = true;
        providersError = null;
        try {
            const response = await fetch(
                "https://api.bugswriter.ai/api/v1/auth/oauth2/providers",
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
                    : "Could not load sign-up options."; // Changed message to 'sign-up'
            console.error("Error fetching providers:", e);
        } finally {
            isProvidersLoading = false;
        }
    }

    // NEW FUNCTION: Handle OAuth Redirect (copied from LoginModal)
    function handleOAuthLogin(authUrl: string) {
        // Set state and redirect. We disable the modal close/other buttons
        // while we wait for the redirect.
        isOAuthRedirecting = true;
        error = null; // Clear general error

        // IMPORTANT: Perform the full page redirect using the pre-generated auth_url
        window.location.href = authUrl;
    }

    // Effect: Reactively fetch providers when the modal opens
    $: if (isOpen) {
        // Reset local state on modal open
        name = "";
        email = "";
        password = "";
        error = null;
        isLoading = false;
        isOAuthRedirecting = false; // Reset redirect state on open

        // Fetch providers when modal opens
        fetchProviders();
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
            class="relative rounded-2xl border border-border bg-background text-accent-foreground shadow-2xl"
        >
            <!-- CLOSE BUTTON -->
            <button
                on:click={closeModal}
                class="absolute top-3 right-3 rounded-full p-2 text-gray-500 hover:bg-gray-100 transition-colors"
                aria-label="Close registration form"
                disabled={isLoading || isOAuthRedirecting}
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

            <!-- FORM and OAUTH -->
            <div class="p-6 space-y-5">
                <!-- OAUTH PROVIDERS SECTION -->
                {#if isProvidersLoading}
                    <div
                        class="flex justify-center items-center py-4 text-gray-500"
                    >
                        <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                        <span>Loading sign-up options...</span>
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
                            <span>Sign Up with {provider.display_name}</span>
                        </button>
                    {/each}

                    <!-- SEPARATOR -->
                    <div class="relative flex items-center">
                        <div class="flex-grow border-t border-gray-200"></div>
                        <span
                            class="flex-shrink mx-4 text-xs text-gray-400 uppercase"
                            >Or sign up with</span
                        >
                        <div class="flex-grow border-t border-gray-200"></div>
                    </div>
                {/if}

                <!-- EMAIL/PASSWORD FORM -->
                <form on:submit|preventDefault={handleSubmit} class="space-y-5">
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
                            disabled={isLoading || isOAuthRedirecting}
                            class="block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 shadow-inner focus:outline-none focus:ring-2 focus:accent placeholder:text-gray-400 disabled:opacity-50"
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
                            disabled={isLoading || isOAuthRedirecting}
                            class="block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 shadow-inner focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-gray-400 disabled:opacity-50"
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
                            disabled={isLoading || isOAuthRedirecting}
                            class="block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 shadow-inner focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-gray-400 disabled:opacity-50"
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
                        class="mt-3 inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary text-white font-semibold text-sm shadow-md transition-all hover:bg-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
                        disabled={isLoading || isOAuthRedirecting}
                    >
                        {#if isLoading || isOAuthRedirecting}
                            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                            <span>
                                {#if isOAuthRedirecting}
                                    Redirecting...
                                {:else}
                                    Creating account...
                                {/if}
                            </span>
                        {:else}
                            <UserPlus class="mr-2 h-4 w-4" />
                            <span>Sign Up</span>
                        {/if}
                    </button>
                </form>
            </div>

            <!-- FOOTER -->
            <div
                class="border-t border-gray-200 px-6 py-4 text-center text-sm text-gray-500"
            >
                Already have an account?
                <!-- LINK: UNIFIED DESIGN - Standard blue link color -->
                <button
                    on:click={handleSwitchToLogin}
                    class="ml-1 font-semibold text-primary hover:underline focus:outline-none"
                    disabled={isLoading || isOAuthRedirecting}
                >
                    Sign in
                </button>
            </div>
        </div>
    </div>
{/if}
