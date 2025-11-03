<!-- src/routes/verify-email/[token]/+page.svelte -->
<script lang="ts">
    import { page } from "$app/stores";
    import { CheckCircle, AlertCircle, Loader2, Home } from "lucide-svelte";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";

    $: data = $page.data;

    // Auto-redirect after success
    onMount(() => {
        if (data.status === 'success') {
            setTimeout(() => {
                goto('/', { replaceState: true });
            }, 5000); // Redirect after 5 seconds
        }
    });

    $: isLoading = !data.status;
</script>

<!-- UNIFIED DESIGN: Standard light card aesthetic -->
<div class="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-transparent p-4">
    <div
        class="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-2xl"
    >
        {#if isLoading}
            <!-- Initial Loading State -->
            <Loader2 class="mx-auto h-10 w-10 animate-spin text-blue-600" />
            <h1 class="mt-4 text-xl font-semibold text-gray-900">
                Verifying your email...
            </h1>
            <p class="mt-3 text-sm text-gray-500">Please wait, this should only take a moment.</p>
        {:else if data.status === 'success'}
            <!-- Success State -->
            <CheckCircle class="mx-auto h-12 w-12 text-green-500" />
            <h1 class="mt-4 text-2xl font-bold text-gray-900">
                Verification Complete!
            </h1>
            <p class="mt-3 text-gray-600">
                {data.message} You will be redirected to the homepage shortly.
            </p>
            <!-- PRIMARY BUTTON: UNIFIED DESIGN - Standard blue -->
            <button
                on:click={() => goto('/')}
                class="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-700"
            >
                <Home class="h-4 w-4" />
                Go Home Now
            </button>
        {:else if data.status === 'error'}
            <!-- Error State -->
            <AlertCircle class="mx-auto h-12 w-12 text-red-600" />
            <h1 class="mt-4 text-2xl font-bold text-gray-900">
                Verification Failed
            </h1>
            <p class="mt-3 text-gray-600">
                {data.message}
            </p>
            <!-- SECONDARY BUTTON: UNIFIED DESIGN - Standard gray/border -->
            <button
                on:click={() => goto('/pricing')}
                class="mt-6 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-100"
            >
                <Home class="h-4 w-4" />
                Explore Pricing
            </button>
        {/if}
    </div>
</div>
