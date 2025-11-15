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
                `${API_CONFIG.bizAPIURL}/api/v1/auth/oauth2/google`,
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
    />

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
            <!-- Header -->
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

            <!-- Content -->
            <div class="p-6">
                {#if successMessage}
                    <div
                        transition:fade={{ duration: 150 }}
                        class="flex flex-col items-center justify-center space-y-4 rounded-lg border border-border bg-muted/50 p-6 text-center"
                    >
                        <Mail class="h-8 w-8 text-primary" />
                        <p class="font-semibold text-foreground">
                            {successMessage}
                        </p>
                        <p class="text-sm text-muted-foreground">
                            Please check your inbox (and spam folder) to
                            complete your registration.
                        </p>
                        <button
                            on:click={handleSwitchToLogin}
                            class="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            <LogIn class="h-4 w-4" />
                            <span>Proceed to Login</span>
                        </button>
                    </div>
                {:else}
                    <div class="space-y-4">
                        {#if isGoogleUrlLoading}
                            <div
                                class="flex justify-center items-center py-4 text-muted-foreground text-sm"
                            >
                                <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                                <span>Loading sign-up options...</span>
                            </div>
                        {:else if googleUrlError}
                            <div
                                class="flex items-center gap-2 rounded-md bg-danger/10 border border-danger/20 p-3 text-sm text-danger"
                            >
                                <AlertCircle class="h-4 w-4 flex-shrink-0" />
                                <p>{googleUrlError}</p>
                            </div>
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
                                <div class="flex-grow border-t border-border" />
                                <span
                                    class="flex-shrink mx-4 text-xs uppercase text-muted-foreground"
                                    >Or</span
                                >
                                <div class="flex-grow border-t border-border" />
                            </div>
                        {/if}

                        <form
                            on:submit|preventDefault={handleSubmit}
                            class="space-y-4"
                        >
                            <div>
                                <label
                                    for="reg-name"
                                    class="mb-1.5 block text-sm font-medium text-foreground"
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
                                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>

                            <div>
                                <label
                                    for="reg-email"
                                    class="mb-1.5 block text-sm font-medium text-foreground"
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
                                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>

                            <div>
                                <label
                                    for="reg-password"
                                    class="mb-1.5 block text-sm font-medium text-foreground"
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
                                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>

                            {#if error}
                                <div
                                    class="flex items-center gap-2 rounded-md bg-danger/10 border border-danger/20 p-3 text-sm text-danger"
                                >
                                    <AlertCircle
                                        class="h-4 w-4 flex-shrink-0"
                                    />
                                    <p>{error}</p>
                                </div>
                            {/if}

                            <button
                                type="submit"
                                class="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary text-primary-foreground font-medium ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                                disabled={isLoading || isOAuthRedirecting}
                            >
                                {#if isLoading || isOAuthRedirecting}
                                    <Loader2
                                        class="mr-2 h-4 w-4 animate-spin"
                                    />
                                    <span
                                        >{isOAuthRedirecting
                                            ? "Redirecting..."
                                            : "Creating account..."}</span
                                    >
                                {:else}
                                    <UserPlus class="mr-2 h-4 w-4" />
                                    <span>Sign Up</span>
                                {/if}
                            </button>
                        </form>
                    </div>
                {/if}
            </div>

            <!-- Footer -->
            {#if !successMessage}
                <div
                    class="border-t border-border bg-muted/50 p-4 text-center text-sm"
                >
                    <span class="text-muted-foreground"
                        >Already have an account?</span
                    >
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
