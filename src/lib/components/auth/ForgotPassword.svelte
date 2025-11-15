<!-- src/lib/components/auth/ForgotPassword.svelte -->
<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { fade, scale } from "svelte/transition";
    import { X, Loader2, AlertCircle, Mail, ArrowLeft } from "lucide-svelte";

    export let isOpen = false;
    const dispatch = createEventDispatcher();

    let email = "";
    let isLoading = false;
    let error: string | null = null;
    let isEmailSent = false;

    // This should be an environment variable in a real application
    const FORGOT_PASSWORD_API =
        `${API_CONFIG.bizAPIURL}/api/v1/auth/password/forgot`;

    function closeModal() {
        if (isLoading) return;
        dispatch("close");
    }

    function handleSwitchToLogin() {
        dispatch("switchToLogin");
    }

    async function handleRequestReset() {
        isLoading = true;
        error = null;
        isEmailSent = false;

        try {
            const response = await fetch(FORGOT_PASSWORD_API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            if (!response.ok) {
                const errorData = await response
                    .json()
                    .catch(() => ({ message: "Failed to send reset email." }));
                throw new Error(
                    errorData.message || "An unknown error occurred.",
                );
            }

            isEmailSent = true;
        } catch (e) {
            error =
                e instanceof Error
                    ? e.message
                    : "An unexpected error occurred.";
        } finally {
            isLoading = false;
        }
    }

    $: if (isOpen) {
        email = "";
        error = null;
        isLoading = false;
        isEmailSent = false;
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
        aria-labelledby="forgot-title"
    >
        <div
            class="relative flex flex-col rounded-xl border border-border bg-background text-foreground shadow-2xl"
        >
            <!-- Header -->
            <div
                class="flex items-start justify-between p-4 border-b border-border"
            >
                <div>
                    <h2 id="forgot-title" class="text-lg font-semibold">
                        Forgot Password
                    </h2>
                    <p class="text-sm text-muted-foreground">
                        {#if !isEmailSent}
                            Enter your email to get a reset link.
                        {:else}
                            Instructions have been sent.
                        {/if}
                    </p>
                </div>
                <button
                    on:click={closeModal}
                    class="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Close"
                    disabled={isLoading}
                >
                    <X class="h-5 w-5" />
                </button>
            </div>

            <!-- Content -->
            <div class="p-6">
                {#if isEmailSent}
                    <div
                        transition:fade={{ duration: 150 }}
                        class="flex flex-col items-center justify-center space-y-4 rounded-lg border border-border bg-muted/50 p-6 text-center"
                    >
                        <Mail class="h-8 w-8 text-primary" />
                        <p class="font-semibold text-foreground">
                            Check your email
                        </p>
                        <p class="text-sm text-muted-foreground">
                            We've sent password reset instructions to
                            <span class="font-medium text-foreground"
                                >{email}</span
                            >.
                        </p>
                        <button
                            on:click={closeModal}
                            class="mt-2 inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90"
                        >
                            <span>Done</span>
                        </button>
                    </div>
                {:else}
                    <form
                        on:submit|preventDefault={handleRequestReset}
                        class="space-y-4"
                    >
                        <div>
                            <label
                                for="forgot-email"
                                class="mb-1.5 block text-sm font-medium text-foreground"
                                >Email</label
                            >
                            <input
                                bind:value={email}
                                id="forgot-email"
                                type="email"
                                placeholder="you@example.com"
                                required
                                disabled={isLoading}
                                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>

                        {#if error}
                            <div
                                class="flex items-center gap-2 rounded-md bg-danger/10 border border-danger/20 p-3 text-sm text-danger"
                            >
                                <AlertCircle class="h-4 w-4 flex-shrink-0" />
                                <p>{error}</p>
                            </div>
                        {/if}

                        <button
                            type="submit"
                            class="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary text-primary-foreground font-medium ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                            disabled={isLoading}
                        >
                            {#if isLoading}
                                <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                                <span>Sending...</span>
                            {:else}
                                <Mail class="mr-2 h-4 w-4" />
                                <span>Send Reset Link</span>
                            {/if}
                        </button>
                    </form>
                {/if}
            </div>

            <!-- Footer -->
            <div
                class="border-t border-border bg-muted/50 p-4 text-center text-sm"
            >
                <button
                    on:click={handleSwitchToLogin}
                    class="flex items-center justify-center w-full gap-2 font-semibold text-primary hover:underline focus:outline-none"
                    disabled={isLoading}
                >
                    <ArrowLeft class="h-4 w-4" />
                    <span>Back to Sign In</span>
                </button>
            </div>
        </div>
    </div>
{/if}
