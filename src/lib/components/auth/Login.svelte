<!-- src/lib/components/auth/LoginModal.svelte -->
<script lang="ts">
    import { createEventDispatcher, onMount, onDestroy } from "svelte";
    import { fade, fly } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import { authStore } from "$lib/stores/authStore";
    import { X, LogIn, Loader2, AlertCircle, Sparkles } from "lucide-svelte";

    export let isOpen = false;

    const dispatch = createEventDispatcher();

    let email = "";
    let password = "";
    let isLoading = false;
    let error: string | null = null;

    function closeModal() {
        // Only dispatch close if it's not in the middle of loading
        if (!isLoading) {
            dispatch("close");
        }
    }

    function handleSwitchToRegister() {
        dispatch("switchToRegister");
    }

    async function handleSubmit() {
        isLoading = true;
        error = null;
        try {
            await authStore.login(email, password);
            dispatch("success"); // Notify parent that login was successful
        } catch (e) {
            error =
                e instanceof Error
                    ? e.message
                    : "An unknown login error occurred.";
        } finally {
            isLoading = false;
        }
    }

    function handleKeydown(event: KeyboardEvent) {
        if (isOpen && event.key === "Escape") {
            closeModal();
        }
    }

    // Reset form state when the modal is opened
    $: if (isOpen) {
        email = "";
        password = "";
        error = null;
        isLoading = false;
    }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div
        on:click={closeModal}
        transition:fade={{ duration: 150 }}
        class="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
        aria-hidden="true"
    ></div>

    <div
        transition:fly={{ duration: 250, y: 20, easing: quintOut }}
        class="fixed top-1/2 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
    >
        <div
            class="relative overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl"
        >
            <button
                on:click={closeModal}
                class="absolute top-3 right-3 z-10 rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                aria-label="Close login form"
            >
                <X class="h-5 w-5" />
            </button>

            <div class="p-8">
                <div class="flex flex-col items-center text-center">
                    <div
                        class="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"
                    >
                        <Sparkles class="h-8 w-8" />
                    </div>
                    <h2 id="login-title" class="mt-4 text-2xl font-bold">
                        Welcome Back!
                    </h2>
                    <p class="mt-1 text-muted-foreground">
                        Let's get you signed in.
                    </p>
                </div>

                <form
                    on:submit|preventDefault={handleSubmit}
                    class="mt-8 space-y-4"
                >
                    <div>
                        <label
                            for="login-email"
                            class="mb-1.5 block text-sm font-medium text-foreground/80"
                            >Email</label
                        >
                        <input
                            bind:value={email}
                            id="login-email"
                            type="email"
                            placeholder="you@example.com"
                            required
                            disabled={isLoading}
                            class="block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                        />
                    </div>
                    <div>
                        <label
                            for="login-password"
                            class="mb-1.5 block text-sm font-medium text-foreground/80"
                            >Password</label
                        >
                        <input
                            bind:value={password}
                            id="login-password"
                            type="password"
                            placeholder="••••••••"
                            required
                            disabled={isLoading}
                            class="block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                        />
                    </div>

                    {#if error}
                        <div
                            transition:fade={{ duration: 150 }}
                            class="flex items-center gap-2 rounded-md bg-destructive/10 p-2 text-sm text-destructive"
                        >
                            <AlertCircle class="h-4 w-4 flex-shrink-0" />
                            <p>{error}</p>
                        </div>
                    {/if}

                    <button
                        type="submit"
                        class="mt-2 inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50"
                        disabled={isLoading}
                    >
                        {#if isLoading}
                            <Loader2 class="mr-2 h-5 w-5 animate-spin" />
                            <span>Signing in...</span>
                        {:else}
                            <LogIn class="mr-2 h-4 w-4" />
                            <span>Sign In</span>
                        {/if}
                    </button>
                </form>
            </div>

            <div
                class="border-t border-border bg-muted/50 px-8 py-4 text-center text-sm"
            >
                <p class="text-muted-foreground">
                    Need an account?
                    <button
                        on:click={handleSwitchToRegister}
                        class="font-semibold text-primary hover:underline"
                    >
                        Sign up
                    </button>
                </p>
            </div>
        </div>
    </div>
{/if}
