<!-- src/lib/components/auth/RegisterModal.svelte -->
<script lang="ts">
    import { createEventDispatcher, onMount, onDestroy } from "svelte";
    import { fade, fly } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import { authStore } from "$lib/stores/authStore";
    import {
        X,
        UserPlus,
        Loader2,
        AlertCircle,
        PartyPopper,
    } from "lucide-svelte";

    export let isOpen = false;

    const dispatch = createEventDispatcher();

    let name = "";
    let email = "";
    let password = "";
    let isLoading = false;
    let error: string | null = null;

    function closeModal() {
        if (!isLoading) {
            dispatch("close");
        }
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
            // Dispatch success with the message from the store
            dispatch("success", { message: successMessage });
        } catch (e) {
            error =
                e instanceof Error
                    ? e.message
                    : "An unknown registration error occurred.";
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
        name = "";
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
        aria-labelledby="register-title"
    >
        <div
            class="relative overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl"
        >
            <button
                on:click={closeModal}
                class="absolute top-3 right-3 z-10 rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                aria-label="Close registration form"
            >
                <X class="h-5 w-5" />
            </button>

            <div class="p-8">
                <div class="flex flex-col items-center text-center">
                    <div
                        class="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"
                    >
                        <PartyPopper class="h-8 w-8" />
                    </div>
                    <h2 id="register-title" class="mt-4 text-2xl font-bold">
                        Create an Account
                    </h2>
                    <p class="mt-1 text-muted-foreground">
                        Join us! It's quick and easy.
                    </p>
                </div>

                <form
                    on:submit|preventDefault={handleSubmit}
                    class="mt-8 space-y-4"
                >
                    <div>
                        <label
                            for="reg-name"
                            class="mb-1.5 block text-sm font-medium text-foreground/80"
                            >Full Name</label
                        >
                        <input
                            bind:value={name}
                            id="reg-name"
                            type="text"
                            placeholder="Bugs Writer"
                            required
                            disabled={isLoading}
                            class="block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                        />
                    </div>
                    <div>
                        <label
                            for="reg-email"
                            class="mb-1.5 block text-sm font-medium text-foreground/80"
                            >Email</label
                        >
                        <input
                            bind:value={email}
                            id="reg-email"
                            type="email"
                            placeholder="you@example.com"
                            required
                            disabled={isLoading}
                            class="block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                        />
                    </div>
                    <div>
                        <label
                            for="reg-password"
                            class="mb-1.5 block text-sm font-medium text-foreground/80"
                            >Password</label
                        >
                        <input
                            bind:value={password}
                            id="reg-password"
                            type="password"
                            placeholder="Minimum 8 characters"
                            required
                            minlength="8"
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
                            <span>Creating Account...</span>
                        {:else}
                            <UserPlus class="mr-2 h-4 w-4" />
                            <span>Sign Up</span>
                        {/if}
                    </button>
                </form>
            </div>

            <div
                class="border-t border-border bg-muted/50 px-8 py-4 text-center text-sm"
            >
                <p class="text-muted-foreground">
                    Already have an account?
                    <button
                        on:click={handleSwitchToLogin}
                        class="font-semibold text-primary hover:underline"
                    >
                        Sign in
                    </button>
                </p>
            </div>
        </div>
    </div>
{/if}
