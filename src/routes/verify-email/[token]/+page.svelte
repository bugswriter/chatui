<!-- src/routes/verify-email/[token]/+page.svelte -->
<script lang="ts">
    import { page } from "$app/stores";
    import { CheckCircle, AlertCircle, Loader2, Home } from "lucide-svelte";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import { authStore } from "$lib/stores/authStore";

    // This data is passed from the +page.server.ts load function
    $: data = $page.data;

    // Auto-redirect after success
    onMount(() => {
        if (data.status === "success") {
            // Refresh user details to reflect verified status
            authStore.refreshUser();
            setTimeout(() => {
                goto("/", { replaceState: true });
            }, 3000); // Redirect after 5 seconds
        }
    });

    // A simple reactive flag for the initial loading state before data is available
    $: isLoading = !data.status;

    function handleGoHome() {
        goto("/", { replaceState: true });
    }
</script>

<div
    class="flex min-h-screen items-center justify-center bg-background p-4 pt-16 text-foreground"
>
    <div
        class="w-full max-w-lg rounded-xl border border-border bg-background p-8 text-center shadow-xl"
    >
        {#if isLoading}
            <!-- Initial Loading State -->
            <Loader2 class="mx-auto h-12 w-12 animate-spin text-primary" />
            <h1 class="mt-6 text-2xl font-semibold text-foreground">
                Verifying Your Email...
            </h1>
            <p class="mt-2 text-base text-muted-foreground">
                Please wait, this should only take a moment.
            </p>
        {:else if data.status === "success"}
            <!-- Success State -->
            <CheckCircle class="mx-auto h-12 w-12 text-green-500" />
            <h1 class="mt-6 text-2xl font-bold text-foreground">
                Verification Complete!
            </h1>
            <p class="mt-2 text-base text-muted-foreground">
                {data.message} You will be redirected to the homepage shortly.
            </p>
            <button
                on:click={handleGoHome}
                class="mt-8 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90"
            >
                <Home class="h-4 w-4" />
                <span>Go Home Now</span>
            </button>
        {:else if data.status === "error"}
            <!-- Error State -->
            <AlertCircle class="mx-auto h-12 w-12 text-danger" />
            <h1 class="mt-6 text-2xl font-bold text-foreground">
                Verification Failed
            </h1>
            <p class="mt-2 text-base text-muted-foreground">
                {data.message}
            </p>
            <button
                on:click={handleGoHome}
                class="mt-8 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-muted px-4 text-sm font-medium text-muted-foreground ring-offset-background transition-colors hover:bg-muted/80"
            >
                <Home class="h-4 w-4" />
                <span>Return to Homepage</span>
            </button>
        {/if}
    </div>
</div>
