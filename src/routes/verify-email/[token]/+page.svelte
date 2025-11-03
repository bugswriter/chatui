<!-- src/routes/verify-email/[token]/+page.svelte -->
<script lang="ts">
    import { page } from "$app/stores";
    import { CheckCircle, AlertCircle, Loader2, Home } from "lucide-svelte";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";

    // Data loaded from +page.ts is available via the $page store
    $: data = $page.data;

    // Auto-redirect after success
    onMount(() => {
        if (data.status === 'success') {
            setTimeout(() => {
                goto('/', { replaceState: true });
            }, 5000); // Redirect after 5 seconds
        }
    });

    // Determine the loading state based on whether the data properties exist
    $: isLoading = !data.status;
</script>

<div class="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-transparent p-4">
    <div
        class="w-full max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-2xl"
    >
        {#if isLoading}
            <!-- Initial Loading State while +page.ts is running -->
            <Loader2 class="mx-auto h-10 w-10 animate-spin text-primary" />
            <h1 class="mt-4 text-xl font-semibold text-foreground">
                Verifying your email...
            </h1>
            <p class="mt-3 text-sm text-muted-foreground">Please wait, this should only take a moment.</p>
        {:else if data.status === 'success'}
            <!-- Success State -->
            <CheckCircle class="mx-auto h-12 w-12 text-green-500" />
            <h1 class="mt-4 text-2xl font-bold text-foreground">
                Verification Complete!
            </h1>
            <p class="mt-3 text-muted-foreground">
                {data.message} You will be redirected to the homepage shortly.
            </p>
            <button
                on:click={() => goto('/')}
                class="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md transition-colors hover:bg-primary/90"
            >
                <Home class="h-4 w-4" />
                Go Home Now
            </button>
        {:else if data.status === 'error'}
            <!-- Error State -->
            <AlertCircle class="mx-auto h-12 w-12 text-destructive" />
            <h1 class="mt-4 text-2xl font-bold text-foreground">
                Verification Failed
            </h1>
            <p class="mt-3 text-muted-foreground">
                {data.message}
            </p>
            <button
                on:click={() => goto('/pricing')}
                class="mt-6 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-accent"
            >
                <Home class="h-4 w-4" />
                Explore Pricing
            </button>
        {/if}
    </div>
</div>
