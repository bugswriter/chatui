<!-- src/lib/components/auth/LoginModal.svelte -->
<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { fade, fly } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import { authStore } from "$lib/stores/authStore";
    import {
        X,
        LogIn,
        Loader2,
        AlertCircle,
        ExternalLink,
    } from "lucide-svelte";

    export let isOpen = false;
    const dispatch = createEventDispatcher();

    let email = "";
    let password = "";
    let isLoading = false; // For email/password submission
    let error: string | null = null;

    // ✅ FIX: State simplified for a single OAuth provider (Google)
    let googleAuthUrl: string | null = null;
    let isGoogleUrlLoading = false;
    let googleUrlError: string | null = null;

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

    // ✅ FIX: Renamed and updated function to fetch only the Google Auth URL
    async function fetchGoogleAuthUrl() {
        if (googleAuthUrl || isGoogleUrlLoading) return;

        isGoogleUrlLoading = true;
        googleUrlError = null;
        try {
            const response = await fetch(
                "https://api.bugswriter.ai/api/v1/auth/oauth2/google",
            );

            if (!response.ok) {
                throw new Error("Failed to get Google sign-in link.");
            }

            const data = await response.json();
            // ✅ FIX: Directly assign the auth_url from the response object
            googleAuthUrl = data.auth_url;
        } catch (e) {
            googleUrlError =
                e instanceof Error
                    ? e.message
                    : "Could not load sign-in options.";
            console.error(e);
        } finally {
            isGoogleUrlLoading = false;
        }
    }

    // NEW FUNCTION: Handle OAuth Redirect
    function handleOAuthLogin(authUrl: string) {
        isOAuthRedirecting = true;
        error = null;
        window.location.href = authUrl;
    }

    // Reactively fetch providers when the modal opens
    $: if (isOpen) {
        email = "";
        password = "";
        error = null;
        isLoading = false;
        isOAuthRedirecting = false;
        // ✅ FIX: Reset correct state variables and fetch the Google URL
        googleAuthUrl = null;
        googleUrlError = null;
        fetchGoogleAuthUrl();
    }
</script>

<svelte:window on:keydown={(e) => e.key === "Escape" && closeModal()} />

{#if isOpen}
    <!-- BACKGROUND -->
    <div
        on:click={closeModal}
        transition:fade={{ duration: 200 }}
        class="fixed inset-0 z-40 bg-chat/20 backdrop-blur-sm"
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
            class="relative rounded-2xl border border-border bg-background text-foreground shadow-2xl"
        >
            <button
                on:click={closeModal}
                class="absolute top-3 right-3 rounded-full p-2 text-foreground/50 hover:bg-gray-100 transition-colors"
                aria-label="Close"
                disabled={isLoading || isOAuthRedirecting}
            >
                <X class="h-5 w-5" />
            </button>

            <div class="p-6 border-b border-border/50">
                <h2 id="login-title" class="text-xl font-semibold">Sign In</h2>
                <p class="mt-1 text-sm text-foreground/50">
                    Access your account to continue.
                </p>
            </div>

            <div class="p-6 space-y-5">
                <!-- ✅ FIX: Updated OAuth section to handle a single provider -->
                {#if isGoogleUrlLoading}
                    <div
                        class="flex justify-center items-center py-4 text-foreground/50"
                    >
                        <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                        <span>Loading sign-in options...</span>
                    </div>
                {:else if googleUrlError}
                    <div
                        class="flex items-center gap-2 rounded-md bg-red-50 border border-red-300 p-2 text-sm text-red-600"
                    >
                        <AlertCircle class="h-4 w-4 flex-shrink-0" />
                        <p>{googleUrlError}</p>
                    </div>
                {:else if googleAuthUrl}
                    <!-- Single Google Sign-In Button -->
                    <button
                        on:click={() => handleOAuthLogin(googleAuthUrl!)}
                        class="inline-flex h-10 w-full items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 font-semibold text-sm shadow-sm transition-all hover:bg-gray-50 disabled:opacity-50"
                        disabled={isLoading || isOAuthRedirecting}
                    >
                        <ExternalLink class="mr-2 h-4 w-4" />
                        <span>Sign In with Google</span>
                    </button>

                    <!-- SEPARATOR -->
                    <div class="relative flex items-center">
                        <div class="flex-grow border-t border-border/40"></div>
                        <span
                            class="flex-shrink mx-4 text-xs text-foreground/60 uppercase"
                            >Or continue with</span
                        >
                        <div class="flex-grow border-t border-border/40"></div>
                    </div>
                {/if}

                <!-- EMAIL/PASSWORD FORM -->
                <form on:submit|preventDefault={handleSubmit} class="space-y-5">
                    <div>
                        <label
                            for="login-email"
                            class="mb-1.5 block text-sm text-foreground"
                            >Email</label
                        >
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
                            class="mb-1.5 block text-sm text-foreground"
                            >Password</label
                        >
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
                        <div
                            class="flex items-center gap-2 rounded-md bg-red-50 border border-red-300 p-2 text-sm text-red-600"
                        >
                            <AlertCircle class="h-4 w-4 flex-shrink-0" />
                            <p>{error}</p>
                        </div>
                    {/if}

                    <button
                        type="submit"
                        class="inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary text-white font-semibold text-sm shadow-md transition-all hover:bg-primary/80 disabled:opacity-50"
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
                <div class="flex justify-end pt-1">
                    <button
                        on:click={handleSwitchToForgotPassword}
                        class="text-sm font-semibold text-primary hover:underline focus:outline-none"
                        disabled={isLoading || isOAuthRedirecting}
                    >
                        Forgot Password?
                    </button>
                </div>
            </div>

            <div
                class="border-t border-border/50 px-6 py-4 text-center text-sm text-foreground/80"
            >
                Don’t have an account?
                <button
                    on:click={handleSwitchToRegister}
                    class="ml-1 font-semibold text-primary hover:underline focus:outline-none"
                    disabled={isLoading || isOAuthRedirecting}
                >
                    Sign up
                </button>
            </div>
        </div>
    </div>
{/if}
