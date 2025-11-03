<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { Loader2, AlertCircle, CheckCircle } from "lucide-svelte";

    // Get the token from the URL path parameter (e.g., /reset-password/<token>)
    let token: string = $page.params.token;

    let password = "";
    let passwordConfirm = "";
    let isLoading = false;
    let error: string | null = null;
    let successMessage: string | null = null;

    const RESET_CONFIRM_API =
        "https://api.bugswriter.ai/api/v1/auth/password/reset-confirm"; // Your backend endpoint

    /**
     * Handles the submission of the new password and reset token.
     */
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
                headers: {
                    "Content-Type": "application/json",
                },
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
                        "Password reset failed. Token might be expired or invalid.",
                );
            }

            successMessage =
                "Your password has been successfully updated. You can now log in.";

            // Redirect after success
            setTimeout(() => {
                goto("/login");
            }, 3000);
        } catch (e) {
            error =
                e instanceof Error
                    ? e.message
                    : "An unexpected error occurred during reset.";
        } finally {
            isLoading = false;
        }
    }
</script>

<!-- Full-page layout for the password reset form -->
<div class="flex min-h-screen items-center justify-center bg-gray-50 p-4">
    <div
        class="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-gray-900 shadow-2xl"
    >
        <div class="border-b border-gray-200 pb-6 mb-6">
            <h1 class="text-2xl font-bold">Set New Password</h1>
            <p class="mt-1 text-sm text-gray-500">
                Enter your new password below.
            </p>
        </div>

        {#if !token}
            <!-- Error state if token is missing in the URL -->
            <div
                class="flex items-center gap-2 rounded-md bg-red-50 border border-red-300 p-3 text-sm text-red-600"
            >
                <AlertCircle class="h-5 w-5 flex-shrink-0" />
                <p>
                    Missing or invalid reset token. Please ensure you clicked
                    the full link from your email.
                </p>
            </div>
            <a
                href="/forgot-password"
                class="mt-4 block text-center text-blue-600 hover:underline"
                >Request a new link</a
            >
        {:else if successMessage}
            <!-- Success state -->
            <div
                class="flex flex-col items-center justify-center space-y-4 rounded-lg border border-green-300 bg-green-50 p-6 text-green-700"
            >
                <CheckCircle class="h-8 w-8 text-green-500" />
                <p class="text-center font-semibold">
                    {successMessage}
                </p>
                <a
                    href="/"
                    class="inline-flex h-10 items-center justify-center rounded-lg bg-green-600 px-4 text-white font-semibold text-sm shadow-md transition-all hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
                >
                    Go to Home
                </a>
            </div>
        {:else}
            <!-- Form for new password -->
            <form
                on:submit|preventDefault={handleResetPassword}
                class="space-y-5"
            >
                <div>
                    <label
                        for="new-password"
                        class="mb-1.5 block text-sm text-gray-700"
                        >New Password</label
                    >
                    <input
                        bind:value={password}
                        id="new-password"
                        type="password"
                        placeholder="••••••••"
                        required
                        minlength="8"
                        disabled={isLoading}
                        class="block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 disabled:opacity-50"
                    />
                </div>

                <div>
                    <label
                        for="confirm-password"
                        class="mb-1.5 block text-sm text-gray-700"
                        >Confirm Password</label
                    >
                    <input
                        bind:value={passwordConfirm}
                        id="confirm-password"
                        type="password"
                        placeholder="••••••••"
                        required
                        minlength="8"
                        disabled={isLoading}
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
                    class="mt-3 inline-flex h-10 w-full items-center justify-center rounded-lg bg-blue-600 text-white font-semibold text-sm shadow-md transition-all hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50"
                    disabled={isLoading}
                >
                    {#if isLoading}
                        <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                        <span>Resetting Password...</span>
                    {:else}
                        <span>Reset Password</span>
                    {/if}
                </button>
            </form>
        {/if}
    </div>
</div>
