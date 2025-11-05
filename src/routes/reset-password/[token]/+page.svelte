<!-- src/routes/reset-password/[token]/+page.svelte -->
<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { Loader2, AlertCircle, CheckCircle, KeyRound } from "lucide-svelte";
    import { fade } from "svelte/transition";
    import { authStore } from "$lib/stores/authStore";
    import { uiStore } from "$lib/stores/uiStore";

    let token: string = $page.params.token;
    let password = "";
    let passwordConfirm = "";
    let isLoading = false;
    let error: string | null = null;
    let successMessage: string | null = null;

    // This should be an environment variable in a real application
    const RESET_CONFIRM_API =
        "https://api.bugswriter.ai/api/v1/auth/password/reset-confirm";

    async function handleResetPassword() {
        if (!token) {
            error = "Invalid or missing password reset token.";
            return;
        }
        if (password.length < 8) {
            error = "Password must be at least 8 characters long.";
            return;
        }
        if (password !== passwordConfirm) {
            error = "Passwords do not match.";
            return;
        }

        isLoading = true;
        error = null;
        successMessage = null;

        try {
            const response = await fetch(RESET_CONFIRM_API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token,
                    password,
                    password_confirm: passwordConfirm,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Password reset failed. The token might be expired or invalid.",
                );
            }

            successMessage =
                "Your password has been successfully updated. You will be redirected to the login page shortly.";

            setTimeout(() => {
                goto("/");
                uiStore.openLoginModal();
            }, 3000);
        } catch (e) {
            error =
                e instanceof Error
                    ? e.message
                    : "An unexpected error occurred.";
        } finally {
            isLoading = false;
        }
    }
</script>

<div
    class="flex min-h-screen items-center justify-center bg-background p-4 pt-16 text-foreground"
>
    <div
        class="w-full max-w-md rounded-xl border border-border bg-background shadow-xl"
    >
        <div class="p-8 text-center border-b border-border">
            <div
                class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"
            >
                <KeyRound class="h-6 w-6 text-primary" />
            </div>
            <h1 class="mt-4 text-2xl font-bold">Set New Password</h1>
            <p class="mt-1 text-sm text-muted-foreground">
                Enter and confirm your new password below.
            </p>
        </div>

        <div class="p-8">
            {#if !token}
                <div
                    class="flex flex-col items-center gap-2 rounded-md bg-danger/10 border border-danger/20 p-4 text-sm text-danger text-center"
                >
                    <AlertCircle class="h-6 w-6" />
                    <p class="font-semibold">Invalid Link</p>
                    <p>
                        This reset link is missing a token. Please ensure you
                        used the full link from your email.
                    </p>
                </div>
            {:else if successMessage}
                <div
                    transition:fade
                    class="flex flex-col items-center justify-center space-y-4 rounded-lg border border-border bg-muted/50 p-6 text-center"
                >
                    <CheckCircle class="h-8 w-8 text-green-500" />
                    <p class="font-semibold text-foreground">
                        Password Updated
                    </p>
                    <p class="text-sm text-muted-foreground">
                        {successMessage}
                    </p>
                </div>
            {:else}
                <form
                    on:submit|preventDefault={handleResetPassword}
                    class="space-y-4"
                >
                    <div>
                        <label
                            for="new-password"
                            class="mb-1.5 block text-sm font-medium text-foreground"
                            >New Password</label
                        >
                        <input
                            bind:value={password}
                            id="new-password"
                            type="password"
                            placeholder="••••••••••••"
                            required
                            minlength="8"
                            disabled={isLoading}
                            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    <div>
                        <label
                            for="confirm-password"
                            class="mb-1.5 block text-sm font-medium text-foreground"
                            >Confirm New Password</label
                        >
                        <input
                            bind:value={passwordConfirm}
                            id="confirm-password"
                            type="password"
                            placeholder="••••••••••••"
                            required
                            minlength="8"
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
                        class="mt-2 inline-flex h-10 w-full items-center justify-center rounded-md bg-primary text-primary-foreground font-medium ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                        disabled={isLoading}
                    >
                        {#if isLoading}
                            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                            <span>Updating Password...</span>
                        {:else}
                            <span>Reset Password</span>
                        {/if}
                    </button>
                </form>
            {/if}
        </div>
    </div>
</div>
