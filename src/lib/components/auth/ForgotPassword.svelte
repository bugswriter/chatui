<!-- src/lib/components/auth/ForgotPassword.svelte -->
<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { fade, fly } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import { X, LogIn, Loader2, AlertCircle, Mail } from "lucide-svelte"; // Added Mail icon for success

    export let isOpen = false;
    const dispatch = createEventDispatcher();

    let email = "";
    let isLoading = false;
    let error: string | null = null;
    let isEmailSent = false; // New state to switch views

    const FORGOT_PASSWORD_API =
        "https://api.bugswriter.ai/api/v1/auth/password/forgot"; // Your backend endpoint

    function closeModal() {
        if (!isLoading) isOpen = false;
    }

    function handleSwitchToLogin() {
        dispatch("switchToLogin");
    }

    /**
     * Sends a request to the server to initiate the password reset process.
     */
    async function handleRequestReset() {
        isLoading = true;
        error = null;
        isEmailSent = false;

        try {
            const response = await fetch(FORGOT_PASSWORD_API, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            if (!response.ok) {
                // Read error message from response body if available
                const errorData = await response
                    .json()
                    .catch(() => ({ message: "Failed to send reset email." }));
                throw new Error(
                    errorData.message || "Failed to send reset email.",
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

    // Reset state when the modal opens
    $: if (isOpen) {
        email = "";
        error = null;
        isLoading = false;
        isEmailSent = false;
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
        aria-labelledby="forgot-title"
    >
        <div
            class="relative rounded-2xl border border-gray-200 bg-white text-gray-900 shadow-2xl"
        >
            <!-- CLOSE BUTTON -->
            <button
                on:click={closeModal}
                class="absolute top-3 right-3 rounded-full p-2 text-gray-500 hover:bg-gray-100 transition-colors"
                aria-label="Close"
                disabled={isLoading}
            >
                <X class="h-5 w-5" />
            </button>

            <!-- HEADER -->
            <div class="p-6 border-b border-gray-200">
                <h2 id="forgot-title" class="text-xl font-semibold">
                    Forgot Password
                </h2>
                <p class="mt-1 text-sm text-gray-500">
                    {#if !isEmailSent}
                        Enter your email to receive a password reset link.
                    {:else}
                        Instructions sent.
                    {/if}
                </p>
            </div>

            <div class="p-6 space-y-5">
                {#if !isEmailSent}
                    <!-- FORM: REQUEST EMAIL -->
                    <form
                        on:submit|preventDefault={handleRequestReset}
                        class="space-y-5"
                    >
                        <div>
                            <label
                                for="forgot-email"
                                class="mb-1.5 block text-sm text-gray-700"
                                >Email</label
                            >
                            <input
                                bind:value={email}
                                id="forgot-email"
                                type="email"
                                placeholder="you@example.com"
                                required
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
                                <span>Sending link...</span>
                            {:else}
                                <Mail class="mr-2 h-4 w-4" />
                                <span>Send Reset Link</span>
                            {/if}
                        </button>
                    </form>
                {:else}
                    <!-- SUCCESS MESSAGE: CHECK EMAIL -->
                    <div
                        transition:fade={{ duration: 150 }}
                        class="flex flex-col items-center justify-center space-y-4 rounded-lg border border-green-300 bg-green-50 p-6 text-green-700"
                    >
                        <Mail class="h-8 w-8 text-green-500" />
                        <p class="text-center font-semibold">
                            Password reset instructions have been sent to
                            <span class="font-bold block text-green-800"
                                >{email}</span
                            >.
                        </p>
                        <p class="text-sm text-center">
                            Please check your inbox (and spam folder) to
                            continue.
                        </p>
                        <!-- Button to redirect to login -->
                        <button
                            on:click={closeModal}
                            class="inline-flex h-10 items-center justify-center rounded-lg bg-green-600 px-4 text-white font-semibold text-sm shadow-md transition-all hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
                        >
                            <span>Done</span>
                        </button>
                    </div>
                {/if}
            </div>

            <!-- FOOTER -->
            <div
                class="border-t border-gray-200 px-6 py-4 text-center text-sm text-gray-500"
            >
                Remember your password?
                <!-- LINK: UNIFIED DESIGN - Standard blue link color -->
                <button
                    on:click={handleSwitchToLogin}
                    class="ml-1 font-semibold text-blue-600 hover:underline focus:outline-none"
                    disabled={isLoading}
                >
                    Sign in
                </button>
            </div>
        </div>
    </div>
{/if}
