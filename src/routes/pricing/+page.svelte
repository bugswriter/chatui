<!-- src/routes/pricing/+page.svelte -->
<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { authStore } from "$lib/stores/authStore";
    import { API_CONFIG, getAuthToken } from "$lib/services/api";
    import Navbar from "$lib/components/Navbar.svelte";
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
        price: number; // in cents
        currency: string;
        coins: string;
    }

    let subscriptionPlans: Product[] = [];
    let oneTimePacks: Product[] = [];
    let isLoading = true;
    let error: string | null = null;
    let redirectingPriceId: string | null = null;

    onMount(async () => {
        try {
            // ✅ FIX: Changed to use authBaseUrl for the payments endpoint
            const response = await fetch(
                `${API_CONFIG.authBaseUrl}/api/v1/payments/products`,
            );
            if (!response.ok) {
                throw new Error(
                    "Could not load available products at this time.",
                );
            }
            const data = await response.json();
            subscriptionPlans = data.subscription_plans || [];
            oneTimePacks = data.one_time_packs || [];
        } catch (e) {
            error =
                e instanceof Error ? e.message : "An unknown error occurred.";
        } finally {
            isLoading = false;
        }
    });

    async function handleCheckout(
        priceId: string,
        mode: "subscription" | "payment",
    ) {
        if (!$authStore.isAuthenticated) {
            goto("/"); // Redirect to login if not authenticated
            return;
        }

        redirectingPriceId = priceId;
        error = null;
        const token = getAuthToken();

        try {
            // Get success/cancel URLs from the browser's current location
            const success_url = `${window.location.origin}/dashboard?checkout=success`;
            const cancel_url = window.location.href;

            // ✅ FIX: Changed to use authBaseUrl for the payments endpoint
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
                        mode: mode,
                        success_url: success_url,
                        cancel_url: cancel_url,
                    }),
                },
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.detail || "Failed to create checkout session.",
                );
            }

            const session = await response.json();
            window.location.href = session.url; // Redirect to Stripe
        } catch (e) {
            error =
                e instanceof Error
                    ? e.message
                    : "An error occurred during checkout.";
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

<div
    class="min-h-screen bg-gradient-to-b from-white via-[#faf9f6] to-[#f5f3f0] text-[#1a1a1a]"
>
    <Navbar />

    <main class="container mx-auto px-4 py-24 sm:py-32">
        <div class="mx-auto max-w-2xl text-center">
            <h1
                class="text-4xl font-bold tracking-tight text-[#1a1a1a] sm:text-6xl"
            >
                Pricing Plans
            </h1>
            <p class="mt-6 text-lg leading-8 text-[#6b6b6b]">
                Choose a plan that fits your needs. Get more coins and unlock
                premium features.
            </p>
        </div>

        {#if isLoading}
            <div class="mt-16 flex justify-center">
                <Loader2 class="h-10 w-10 animate-spin text-[#6b5ce7]" />
            </div>
        {:else if error}
            <div
                class="mt-16 mx-auto flex max-w-md items-center gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-center text-red-700"
            >
                <AlertTriangle class="h-5 w-5 flex-shrink-0" />
                <p>{error}</p>
            </div>
        {:else}
            <div class="mx-auto mt-16 max-w-4xl">
                <h2 class="text-2xl font-bold text-center mb-8 text-[#2e2e2e]">
                    Monthly Subscriptions
                </h2>
                <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
                    {#each subscriptionPlans as plan}
                        <div
                            class="flex flex-col rounded-2xl border border-[#e6e4df] bg-white/70 p-8 shadow-sm ring-1 ring-[#eae8e3] backdrop-blur-sm transition hover:shadow-md hover:ring-[#d7d4ce]"
                        >
                            <h3
                                class="text-lg font-semibold leading-6 text-[#2e2e2e]"
                            >
                                {plan.name}
                            </h3>
                            <p class="mt-2 text-sm text-[#6b6b6b]">
                                {plan.description || " "}
                            </p>
                            <p class="mt-6">
                                <span
                                    class="text-4xl font-bold tracking-tight text-[#1a1a1a]"
                                    >{formatPrice(plan.price)}</span
                                >
                                <span
                                    class="text-sm font-semibold text-[#9b9b9b]"
                                    >/month</span
                                >
                            </p>
                            <button
                                on:click={() =>
                                    handleCheckout(
                                        plan.price_id,
                                        "subscription",
                                    )}
                                disabled={!!redirectingPriceId}
                                class="mt-6 inline-flex h-10 w-full items-center justify-center rounded-md bg-[#6b5ce7] px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-[#594cd0] disabled:pointer-events-none disabled:opacity-50"
                            >
                                {#if redirectingPriceId === plan.price_id}
                                    <Loader2
                                        class="mr-2 h-4 w-4 animate-spin"
                                    />
                                    Redirecting...
                                {:else}
                                    Subscribe
                                {/if}
                            </button>
                            <ul
                                class="mt-8 space-y-3 text-sm leading-6 text-[#6b6b6b]"
                            >
                                <li class="flex gap-x-3">
                                    <CheckCircle
                                        class="h-6 w-5 flex-none text-[#6b5ce7]"
                                    />
                                    <strong>{plan.coins} coins</strong> delivered
                                    monthly
                                </li>
                                <li class="flex gap-x-3">
                                    <CheckCircle
                                        class="h-6 w-5 flex-none text-[#6b5ce7]"
                                    />
                                    Priority access to new features
                                </li>
                                <li class="flex gap-x-3">
                                    <CheckCircle
                                        class="h-6 w-5 flex-none text-[#6b5ce7]"
                                    />
                                    Support continued development
                                </li>
                            </ul>
                        </div>
                    {/each}
                </div>
            </div>

            <div class="mx-auto mt-20 max-w-5xl">
                <div class="relative mb-12">
                    <div
                        class="absolute inset-0 flex items-center"
                        aria-hidden="true"
                    >
                        <div class="w-full border-t border-[#e0ded8]" />
                    </div>
                    <div class="relative flex justify-center">
                        <span
                            class="bg-[#faf9f6] px-4 text-lg font-medium text-[#8c8c8c]"
                            >Or get a one-time pack</span
                        >
                    </div>
                </div>

                <div
                    class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                >
                    {#each oneTimePacks as pack}
                        <div
                            class="flex flex-col items-center rounded-2xl border border-[#e6e4df] bg-white/70 p-6 text-center shadow-sm ring-1 ring-[#eae8e3] backdrop-blur-sm transition hover:shadow-md hover:ring-[#d7d4ce]"
                        >
                            <h3 class="text-lg font-semibold text-[#2e2e2e]">
                                {pack.name}
                            </h3>
                            <p class="mt-4">
                                <span
                                    class="text-3xl font-bold tracking-tight text-[#1a1a1a]"
                                    >{formatPrice(pack.price)}</span
                                >
                            </p>
                            <p class="mt-2 text-sm text-[#6b6b6b]">
                                Get <strong>{pack.coins} coins</strong> instantly
                            </p>
                            <button
                                on:click={() =>
                                    handleCheckout(pack.price_id, "payment")}
                                disabled={!!redirectingPriceId}
                                class="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#e0defa] px-4 py-2 text-sm font-semibold text-[#3b2f9d] shadow-sm transition hover:bg-[#d2cff6] disabled:pointer-events-none disabled:opacity-50"
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
            </div>
        {/if}
    </main>
</div>
