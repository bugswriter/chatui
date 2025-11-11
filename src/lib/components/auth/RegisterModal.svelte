<!-- src/lib/components/auth/RegisterModal.svelte -->
<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { fade, scale } from "svelte/transition";
    import { authStore } from "$lib/stores/authStore";
    import {
        X,
        UserPlus,
        Loader2,
        AlertCircle,
        Mail,
        LogIn,
    } from "lucide-svelte";

    // ... (rest of the script tag is unchanged)
    export let isOpen = false;

    const dispatch = createEventDispatcher();

    let name = "";
    let email = "";
    let password = "";
    let isLoading = false;
    let error: string | null = null;
    let successMessage: string | null = null;
    let googleAuthUrl: string | null = null;
    let isGoogleUrlLoading = false;
    let googleUrlError: string | null = null;
    let isOAuthRedirecting = false;

    function closeModal() {
        if (isLoading || isOAuthRedirecting) return;
        dispatch("close");
    }

    function handleSwitchToLogin() {
        dispatch("switchToLogin");
    }

    async function handleSubmit() {
        isLoading = true;
        error = null;
        try {
            const message = await authStore.register(name, email, password);
            successMessage = message;
        } catch (e) {
            error =
                e instanceof Error
                    ? e.message
                    : "An unknown error occurred during registration.";
        } finally {
            isLoading = false;
        }
    }

    async function fetchGoogleAuthUrl() {
        if (googleAuthUrl || isGoogleUrlLoading) return;
        isGoogleUrlLoading = true;
        googleUrlError = null;
        try {
            const response = await fetch(
                "https://api.bugswriter.ai/api/v1/auth/oauth2/google",
            );
            if (!response.ok) {
                throw new Error("Failed to retrieve Google sign-up link.");
            }
            const data = await response.json();
            googleAuthUrl = data.auth_url;
        } catch (e) {
            googleUrlError =
                e instanceof Error
                    ? e.message
                    : "Could not load sign-up options.";
        } finally {
            isGoogleUrlLoading = false;
        }
    }

    function handleOAuthLogin(authUrl: string) {
        isOAuthRedirecting = true;
        error = null;
        window.location.href = authUrl;
    }

    $: if (isOpen) {
        name = "";
        email = "";
        password = "";
        error = null;
        isLoading = false;
        isOAuthRedirecting = false;
        successMessage = null;
        googleAuthUrl = null;
        googleUrlError = null;
        fetchGoogleAuthUrl();
    }
</script>

<svelte:window on:keydown={(e) => e.key === "Escape" && closeModal()} />

{#if isOpen}
    <!-- Backdrop -->
    <div
        on:click={closeModal}
        transition:fade={{ duration: 150 }}
        class="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
        aria-hidden="true"
    ></div>

    <!-- Modal -->
    <div
        transition:scale={{ duration: 150, start: 0.95 }}
        class="fixed top-1/2 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2"
        role="dialog"
        aria-modal="true"
        aria-labelledby="register-title"
    >
        <div
            class="relative flex flex-col rounded-xl border border-border bg-background text-foreground shadow-2xl"
        >
            <!-- Header (Unchanged) -->
            <div
                class="flex items-start justify-between p-4 border-b border-border"
            >
                <div>
                    <h2 id="register-title" class="text-lg font-semibold">
                        {#if !successMessage}
                            Create Account
                        {:else}
                            Account Created!
                        {/if}
                    </h2>
                    <p class="text-sm text-muted-foreground">
                        {#if !successMessage}
                            Join us to get started.
                        {:else}
                            One last step to get you started.
                        {/if}
                    </p>
                </div>
                <button
                    on:click={closeModal}
                    class="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Close"
                    disabled={isLoading || isOAuthRedirecting}
                >
                    <X class="h-5 w-5" />
                </button>
            </div>

            <!-- Content (Fixes applied here) -->
            <div class="p-6">
                {#if successMessage}
                    <!-- ... (success message block is correct) ... -->
                {:else}
                    <div class="space-y-4">
                        {#if isGoogleUrlLoading}
                            <!-- ... (google loading block is correct) ... -->
                        {:else if googleUrlError}
                            <!-- ... (google error block is correct) ... -->
                        {:else if googleAuthUrl}
                            <button
                                on:click={() =>
                                    handleOAuthLogin(googleAuthUrl!)}
                                class="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-border bg-background font-medium text-foreground ring-offset-background transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                                disabled={isLoading || isOAuthRedirecting}
                            >
                                <svg
                                    class="h-4 w-4"
                                    role="img"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                    ><title>Google</title><path
                                        d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.3 1.62-3.85 1.62-4.64 0-8.59-3.82-8.59-8.59s3.95-8.59 8.59-8.59c2.52 0 4.33.95 5.74 2.33l-2.62 2.62c-1.02-.95-2.2-1.48-3.12-1.48-3.64 0-6.59 2.95-6.59 6.59s2.95 6.59 6.59 6.59c3.12 0 4.5-.95 4.64-2.33h-4.64z"
                                    /></svg
                                >
                                <span>Sign Up with Google</span>
                            </button>
                            <div class="relative flex items-center py-2">
                                <!-- ✅ FIX: Self-closing tag replaced -->
                                <div
                                    class="flex-grow border-t border-border"
                                ></div>
                                <span
                                    class="flex-shrink mx-4 text-xs uppercase text-muted-foreground"
                                    >Or</span
                                >
                                <!-- ✅ FIX: Self-closing tag replaced -->
                                <div
                                    class="flex-grow border-t border-border"
                                ></div>
                            </div>
                        {/if}

                        <form
                            on:submit|preventDefault={handleSubmit}
                            class="space-y-4"
                        >
                            <!-- ... (form inputs are correct) ... -->
                        </form>
                    </div>
                {/if}
            </div>

            <!-- Footer (Unchanged) -->
        </div>
    </div>
{/if}
