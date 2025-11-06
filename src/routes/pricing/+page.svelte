<!-- src/routes/pricing/+page.svelte -->
<script lang="ts">
    import { onMount } from "svelte";
    import { get } from "svelte/store"; // Import 'get'
    import { goto } from "$app/navigation";
    import { authStore } from "$lib/stores/authStore";
    import { uiStore } from "$lib/stores/uiStore";
    import { authToken } from "$lib/stores/tokenStore"; // Import authToken
    import {
        CheckCircle,
        Loader2,
        AlertTriangle,
        ShoppingCart,
        ArrowRight,
    } from "lucide-svelte";
    import { fade } from "svelte/transition";

    interface Product {
        price_id: string;
        name: string;
        description: string | null;
        price: number;
        currency: string;
        coins: string;
        features: string[];
    }

    let subscriptionPlans: Product[] = [];
    let oneTimePacks: Product[] = [];
    let isLoading = true;
    let error: string | null = null;
    let redirectingPriceId: string | null = null;
    let activeTab: "subscription" | "one_time" = "subscription";

    onMount(async () => {
        try {
            // In a real app, this URL should come from an environment variable
            const res = await fetch(
                "https://api.bugswriter.ai/api/v1/payments/products",
            );
            if (!res.ok) throw new Error("Unable to load pricing plans.");
            const data = await res.json();
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
            uiStore.openLoginModal();
            return;
        }
        redirectingPriceId = priceId;
        const token = get(authToken); // Get token directly from authToken store

        try {
            const success_url = `${window.location.origin}/dashboard?checkout=success`;
            const cancel_url = window.location.href;
            // This URL should be an environment variable
            const res = await fetch(
                "https://api.bugswriter.ai/api/v1/payments/checkout-session",
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

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Checkout failed to initialize.");
            }

            const session = await res.json();
            window.location.href = session.url;
        } catch (e) {
            error =
                e instanceof Error
                    ? e.message
                    : "An unknown error occurred during checkout.";
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

<div class="min-h-screen bg-background text-foreground pt-16">
    <main class="container mx-auto px-4 py-24 sm:py-32">
        <div class="mx-auto max-w-4xl items-center text-center">
            <h1
                class="text-4xl font-bold tracking-tight text-foreground sm:text-6xl"
            >
                Pricing Plans
            </h1>
            <p class="mt-4 text-lg text-muted-foreground">
                Choose your path—a steady subscription for continuous access or
                one-time boosters for a creative spark.
            </p>
        </div>

        <!-- Tabs -->
        <div
            class="mt-12 mx-auto max-w-4xl flex justify-center rounded-full border border-border bg-muted/50 p-1.5"
        >
            <button
                on:click={() => (activeTab = "subscription")}
                class="w-1/2 rounded-full px-6 py-2 text-sm font-medium transition-colors {activeTab ===
                'subscription'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'}"
            >
                Subscription
            </button>
            <button
                on:click={() => (activeTab = "one_time")}
                class="w-1/2 rounded-full px-6 py-2 text-sm font-medium transition-colors {activeTab ===
                'one_time'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'}"
            >
                Boosters
            </button>
        </div>

        {#if isLoading}
            <div class="mt-20 flex flex-col items-center justify-center">
                <Loader2 class="h-10 w-10 animate-spin text-primary" />
                <p class="mt-4 text-muted-foreground">Loading plans...</p>
            </div>
        {:else if error}
            <div
                class="mt-20 mx-auto max-w-md flex flex-col items-center gap-3 rounded-lg border border-danger/50 bg-danger/10 p-6 text-center text-danger"
            >
                <AlertTriangle class="h-8 w-8" />
                <p class="font-semibold">Failed to load plans</p>
                <p class="text-sm">{error}</p>
            </div>
        {:else}
            <!-- Content based on tab -->
            <div class="mt-20">
                {#if activeTab === "subscription"}
                    <div
                        transition:fade
                        class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:mx-auto lg:max-w-4xl"
                    >
                        {#each subscriptionPlans as plan (plan.price_id)}
                            <div
                                class="flex flex-col rounded-xl border border-border bg-background p-8 shadow-sm"
                            >
                                <h3
                                    class="text-lg font-semibold text-foreground"
                                >
                                    {plan.name}
                                </h3>
                                <p class="mt-2 text-sm text-muted-foreground">
                                    {plan.description || " "}
                                </p>
                                <div class="mt-6 flex items-baseline gap-1">
                                    <span
                                        class="text-4xl font-bold text-foreground"
                                    >
                                        {formatPrice(plan.price)}
                                    </span>
                                    <span class="text-sm text-muted-foreground"
                                        >/month</span
                                    >
                                </div>

                                <button
                                    on:click={() =>
                                        handleCheckout(
                                            plan.price_id,
                                            "subscription",
                                        )}
                                    disabled={!!redirectingPriceId}
                                    class="mt-8 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground font-medium ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none disabled:opacity-50"
                                >
                                    {#if redirectingPriceId === plan.price_id}
                                        <Loader2 class="h-4 w-4 animate-spin" />
                                        <span>Redirecting...</span>
                                    {:else}
                                        <span>Get Started</span>
                                        <ArrowRight class="h-4 w-4" />
                                    {/if}
                                </button>

                                <ul
                                    class="mt-8 space-y-3 text-sm text-muted-foreground"
                                >
                                    {#each plan.features as feature}
                                        <li class="flex items-start gap-x-3">
                                            <CheckCircle
                                                class="h-5 w-5 flex-shrink-0 text-primary"
                                            />
                                            <span>{@html feature}</span>
                                        </li>
                                    {/each}
                                </ul>
                            </div>
                        {/each}
                    </div>
                {:else}
                    <div
                        transition:fade
                        class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:mx-auto lg:max-w-6xl"
                    >
                        {#each oneTimePacks as pack (pack.price_id)}
                            <div
                                class="flex flex-col rounded-xl border border-border bg-background p-8 text-center shadow-sm"
                            >
                                <h3
                                    class="text-lg font-semibold text-foreground"
                                >
                                    {pack.name}
                                </h3>
                                <p class="mt-2 text-sm text-muted-foreground">
                                    One-time purchase
                                </p>
                                <div
                                    class="mt-6 flex flex-col items-center justify-center"
                                >
                                    <p
                                        class="font-mono text-xl font-bold text-primary"
                                    >
                                        {pack.coins}
                                    </p>
                                    <p class="text-sm text-muted-foreground">
                                        Coins
                                    </p>
                                </div>
                                <p
                                    class="mt-4 text-3xl font-bold text-foreground"
                                >
                                    {formatPrice(pack.price)}
                                </p>

                                <button
                                    on:click={() =>
                                        handleCheckout(
                                            pack.price_id,
                                            "payment",
                                        )}
                                    disabled={!!redirectingPriceId}
                                    class="mt-8 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-foreground text-background font-medium ring-offset-background transition-colors hover:bg-foreground/90 focus-visible:outline-none disabled:opacity-50"
                                >
                                    {#if redirectingPriceId === pack.price_id}
                                        <Loader2 class="h-4 w-4 animate-spin" />
                                        <span>Redirecting...</span>
                                    {:else}
                                        <ShoppingCart class="h-4 w-4" />
                                        <span>Buy Now</span>
                                    {/if}
                                </button>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        {/if}
    </main>
</div>
