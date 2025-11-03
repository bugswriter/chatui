<!-- src/routes/pricing/+page.svelte -->
<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { authStore } from "$lib/stores/authStore";
    import { API_CONFIG, getAuthToken } from "$lib/services/api";
    import {
        CheckCircle,
        Loader2,
        AlertTriangle,
        ShoppingCart,
    } from "lucide-svelte";

    interface Product {
        price_id: string;
        name: string;
        description: string | null;
        price: number;
        currency: string;
        coins: string;
    }

    let subscriptionPlans: Product[] = [];
    let oneTimePacks: Product[] = [];
    let isLoading = true;
    let error: string | null = null;
    let redirectingPriceId: string | null = null;
    let activeTab: "subscription" | "one_time" = "subscription";

    onMount(async () => {
        try {
            const response = await fetch(
                `${API_CONFIG.authBaseUrl}/api/v1/payments/products`,
            );
            if (!response.ok)
                throw new Error("Unable to load pricing at this time.");
            const data = await response.json();
            subscriptionPlans = data.subscription_plans || [];
            oneTimePacks = data.one_time_packs || [];
        } catch (e) {
            error = e instanceof Error ? e.message : "Unknown error.";
        } finally {
            isLoading = false;
        }
    });

    async function handleCheckout(
        priceId: string,
        mode: "subscription" | "payment",
    ) {
        if (!$authStore.isAuthenticated) return goto("/");
        redirectingPriceId = priceId;
        error = null;
        const token = getAuthToken();

        try {
            const success_url = `${window.location.origin}/dashboard?checkout=success`;
            const cancel_url = window.location.href;
            const response = await fetch(
                `${API_CONFIG.authBaseUrl}/api/v1/payments/checkout-session`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        price_id: priceId,
                        mode,
                        success_url,
                        cancel_url,
                    }),
                },
            );

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || "Failed to start checkout.");
            }

            const session = await response.json();
            window.location.href = session.url;
        } catch (e) {
            error = e instanceof Error ? e.message : "Checkout error.";
            redirectingPriceId = null;
        }
    }

    function formatPrice(priceInCents: number) {
        return (priceInCents / 100).toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
        });
    }
</script>

<!-- UNIFIED DESIGN: Use standard light background, clean colors, and primary blue -->
<div
    class="min-h-screen bg-gray-50"
>
    <main class="container mx-auto px-4 py-24 sm:py-32 text-center">
        <h1 class="text-4xl font-extrabold text-gray-900 sm:text-6xl">
            Pricing Plans
        </h1>
        <p class="mt-4 text-lg text-gray-600">
            Choose the perfect plan — whether you need recurring access or a
            one-time boost.
        </p>

        <!-- Tabs: UNIFIED DESIGN - Standardized button colors with primary blue -->
        <div class="mt-12 flex justify-center gap-3">
            <button
                on:click={() => (activeTab = "subscription")}
                class={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    activeTab === "subscription"
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-white text-blue-600 hover:bg-blue-50 border border-blue-200"
                }`}
            >
                Subscription
            </button>
            <button
                on:click={() => (activeTab = "one_time")}
                class={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    activeTab === "one_time"
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-white text-blue-600 hover:bg-blue-50 border border-blue-200"
                }`}
            >
                Boosters
            </button>
        </div>

        <!-- Loader / Error -->
        {#if isLoading}
            <div class="mt-16 flex justify-center">
                <Loader2 class="h-10 w-10 animate-spin text-blue-600" />
            </div>
        {:else if error}
            <div
                class="mt-16 mx-auto max-w-md flex items-center gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700"
            >
                <AlertTriangle class="h-5 w-5" />
                <p>{error}</p>
            </div>
        {:else}
            <!-- Subscription Tab -->
            {#if activeTab === "subscription"}
                <div
                    class="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3"
                >
                    {#each subscriptionPlans as plan}
                        <!-- Card: UNIFIED DESIGN - Standard light card look -->
                        <div
                            class="group flex flex-col rounded-2xl border border-gray-200 bg-white p-8 shadow-lg ring-1 ring-gray-100 transition hover:shadow-xl hover:-translate-y-1"
                        >
                            <h3 class="text-lg font-semibold text-gray-900">
                                {plan.name}
                            </h3>
                            <p class="mt-2 text-sm text-gray-600">
                                {plan.description || " "}
                            </p>
                            <p class="mt-6">
                                <span class="text-4xl font-bold text-gray-900">
                                    {formatPrice(plan.price)}
                                </span>
                                <span class="text-sm text-gray-500"
                                    >/month</span
                                >
                            </p>
                            <!-- PRIMARY BUTTON: UNIFIED DESIGN - Standard blue -->
                            <button
                                on:click={() =>
                                    handleCheckout(
                                        plan.price_id,
                                        "subscription",
                                    )}
                                disabled={!!redirectingPriceId}
                                class="mt-6 inline-flex h-10 w-full items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-semibold transition hover:bg-blue-700 disabled:opacity-50"
                            >
                                {#if redirectingPriceId === plan.price_id}
                                    <Loader2
                                        class="mr-2 h-4 w-4 animate-spin"
                                    /> Redirecting...
                                {:else}
                                    Subscribe
                                {/if}
                            </button>
                            <ul
                                class="mt-8 space-y-3 text-sm text-gray-600 text-left"
                            >
                                <li class="flex items-start gap-x-3">
                                    <CheckCircle
                                        class="h-5 w-5 text-blue-600"
                                    />
                                    <span
                                        ><strong>{plan.coins}</strong> coins monthly</span
                                    >
                                </li>
                                <li class="flex items-start gap-x-3">
                                    <CheckCircle
                                        class="h-5 w-5 text-blue-600"
                                    />
                                    <span>Priority feature access</span>
                                </li>
                                <li class="flex items-start gap-x-3">
                                    <CheckCircle
                                        class="h-5 w-5 text-blue-600"
                                    />
                                    <span>Support continued development</span>
                                </li>
                            </ul>
                        </div>
                    {/each}
                </div>
            {:else}
                <!-- One-time Boosters -->
                <div
                    class="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3"
                >
                    {#each oneTimePacks as pack}
                        <!-- Card: UNIFIED DESIGN - Standard light card look -->
                        <div
                            class="group flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-lg ring-1 ring-gray-100 transition hover:shadow-xl hover:-translate-y-1"
                        >
                            <h3 class="text-lg font-semibold text-gray-900">
                                {pack.name}
                            </h3>
                            <p class="mt-4 text-3xl font-bold text-gray-900">
                                {formatPrice(pack.price)}
                            </p>
                            <p class="mt-2 text-sm text-gray-600">
                                Get <strong>{pack.coins} coins</strong> instantly
                            </p>
                            <!-- SECONDARY BUTTON: UNIFIED DESIGN - Standard light blue/gray -->
                            <button
                                on:click={() =>
                                    handleCheckout(pack.price_id, "payment")}
                                disabled={!!redirectingPriceId}
                                class="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-50 text-blue-700 text-sm font-semibold transition hover:bg-blue-100 disabled:opacity-50"
                            >
                                {#if redirectingPriceId === pack.price_id}
                                    <Loader2 class="h-4 w-4 animate-spin" />
                                {:else}
                                    <ShoppingCart class="h-4 w-4" />
                                {/if}
                                <span>Buy Now</span>
                            </button>
                        </div>
                    {/each}
                </div>
            {/if}
        {/if}
    </main>
</div>
