<!-- src/lib/components/auth/RegisterModal.svelte -->
<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { fade, fly } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import { authStore } from "$lib/stores/authStore";
    import {
        X,
        UserPlus,
        Loader2,
        AlertCircle,
        ExternalLink,
        Mail, // ✅ ADDED: Icon for the success message
        LogIn, // ✅ ADDED: Icon for the success button
    } from "lucide-svelte";

    export let isOpen = false;

    const dispatch = createEventDispatcher();

    let name = "";
    let email = "";
    let password = "";
    let isLoading = false; // For email/password submission
    let error: string | null = null;
    let successMessage: string | null = null; // ✅ ADDED: State for success view

    // ✅ FIX: State simplified for a single OAuth provider (Google)
    let googleAuthUrl: string | null = null;
    let isGoogleUrlLoading = false;
    let googleUrlError: string | null = null;

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
            const message = await authStore.register(name, email, password);
            // ✅ CHANGED: Instead of dispatching, we now set the internal success state.
            // This keeps the modal open and shows the user what to do next.
            successMessage = message;
        } catch (e) {
            error = e instanceof Error ? e.message : "Registration failed.";
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
                throw new Error("Failed to get Google sign-up link.");
            }

            const data = await response.json();
            // ✅ FIX: Directly assign the auth_url from the response object
            googleAuthUrl = data.auth_url;
        } catch (e) {
            googleUrlError =
                e instanceof Error
                    ? e.message
                    : "Could not load sign-up options.";
            console.error("Error fetching google url:", e);
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

    // Effect: Reactively fetch providers when the modal opens
    $: if (isOpen) {
        name = "";
        email = "";
        password = "";
        error = null;
        isLoading = false;
        isOAuthRedirecting = false;
        successMessage = null; // ✅ ADDED: Reset success message on open
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
        class="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm"
        aria-hidden="true"
    ></div>

    <!-- MODAL WINDOW -->
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
            <button
                on:click={closeModal}
                class="absolute top-3 right-3 rounded-full p-2 text-gray-500 hover:bg-gray-100 transition-colors"
                aria-label="Close registration form"
                disabled={isLoading || isOAuthRedirecting}
            >
                <X class="h-5 w-5" />
            </button>

            <div class="p-6 border-b border-gray-200">
                <h2 id="register-title" class="text-xl font-semibold">
                    {#if !successMessage}
                        Create Account
                    {:else}
                        Account Created!
                    {/if}
                </h2>
                <p class="mt-1 text-sm text-gray-500">
                    {#if !successMessage}
                        Join us to get started.
                    {:else}
                        One last step to get you started.
                    {/if}
                </p>
            </div>

            <div class="p-6 space-y-5">
                <!-- ✅ WRAPPED: The entire form is now conditional -->
                {#if !successMessage}
                    <!-- ✅ FIX: Updated OAuth section for a single provider -->
                    {#if isGoogleUrlLoading}
                        <div
                            class="flex justify-center items-center py-4 text-gray-500"
                        >
                            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                            <span>Loading sign-up options...</span>
                        </div>
                    {:else if googleUrlError}
                        <div
                            class="flex items-center gap-2 rounded-md bg-red-50 border border-red-300 p-2 text-sm text-red-600"
                        >
                            <AlertCircle class="h-4 w-4 flex-shrink-0" />
                            <p>{googleUrlError}</p>
                        </div>
                    {:else if googleAuthUrl}
                        <!-- Single Google Sign-Up Button -->
                        <button
                            on:click={() => handleOAuthLogin(googleAuthUrl!)}
                            class="inline-flex h-10 w-full items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 font-semibold text-sm shadow-sm transition-all hover:bg-gray-50 disabled:opacity-50"
                            disabled={isLoading || isOAuthRedirecting}
                        >
                            <ExternalLink class="mr-2 h-4 w-4" />
                            <span>Sign Up with Google</span>
                        </button>

                        <!-- SEPARATOR -->
                        <div class="relative flex items-center">
                            <div
                                class="flex-grow border-t border-gray-200"
                            ></div>
                            <span
                                class="flex-shrink mx-4 text-xs text-gray-400 uppercase"
                                >Or sign up with</span
                            >
                            <div
                                class="flex-grow border-t border-gray-200"
                            ></div>
                        </div>
                    {/if}

                    <!-- EMAIL/PASSWORD FORM -->
                    <form
                        on:submit|preventDefault={handleSubmit}
                        class="space-y-5"
                    >
                        <div>
                            <label
                                for="reg-name"
                                class="mb-1.5 block text-sm text-gray-700"
                            >
                                Full Name
                            </label>
                            <input
                                bind:value={name}
                                id="reg-name"
                                type="text"
                                placeholder="Bugs Writer"
                                required
                                disabled={isLoading || isOAuthRedirecting}
                                class="block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 shadow-inner focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-gray-400 disabled:opacity-50"
                            />
                        </div>

                        <div>
                            <label
                                for="reg-email"
                                class="mb-1.5 block text-sm text-gray-700"
                            >
                                Email
                            </label>
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
                            <div
                                class="flex items-center gap-2 rounded-md bg-red-50 border border-red-300 p-2 text-sm text-red-600"
                            >
                                <AlertCircle class="h-4 w-4 flex-shrink-0" />
                                <p>{error}</p>
                            </div>
                        {/if}

                        <button
                            type="submit"
                            class="mt-3 inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary text-white font-semibold text-sm shadow-md transition-all hover:bg-primary/80 disabled:opacity-50"
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
                {:else}
                    <!-- ✅ NEW: Success View -->
                    <div
                        transition:fade={{ duration: 150 }}
                        class="flex flex-col items-center justify-center space-y-4 rounded-lg border border-green-300 bg-green-50 p-6 text-green-700"
                    >
                        <Mail class="h-8 w-8 text-green-500" />
                        <p class="text-center font-semibold">
                            {successMessage}
                        </p>
                        <p class="text-sm text-center">
                            Please check your inbox (and spam folder) to
                            complete your registration.
                        </p>
                        <button
                            on:click={handleSwitchToLogin}
                            class="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 text-white font-semibold text-sm shadow-md transition-all hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
                        >
                            <LogIn class="h-4 w-4" />
                            <span>Proceed to Login</span>
                        </button>
                    </div>
                {/if}
            </div>

            <!-- ✅ WRAPPED: Footer is now conditional and doesn't show on success -->
            {#if !successMessage}
                <div
                    class="border-t border-gray-200 px-6 py-4 text-center text-sm text-gray-500"
                >
                    Already have an account?
                    <button
                        on:click={handleSwitchToLogin}
                        class="ml-1 font-semibold text-primary hover:underline focus:outline-none"
                        disabled={isLoading || isOAuthRedirecting}
                    >
                        Sign in
                    </button>
                </div>
            {/if}
        </div>
    </div>
{/if}
