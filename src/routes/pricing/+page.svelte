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
        Coins,
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

    function formatPrice(price: number) {
        return price.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
        });
    }
</script>

<div class="min-h-screen bg-background text-foreground pt-16">
    <main class="container mx-auto px-4 py-24 sm:py-32">
        <div class="mx-auto max-w-4xl items-center text-center">
            <h1
                class="text-4xl font-bold tracking-tight text-foreground sm:text-5xl"
            >
                Simple, transparent pricing.
            </h1>
            <p class="mt-6 text-lg text-muted-foreground">
                Get a subscription and use boosters to never run out of coins.
            </p>
        </div>

        <!-- Tabs -->
        <div
            class="mt-16 mx-auto flex w-fit justify-center rounded-full border border-border bg-background/50 p-1.5 backdrop-blur-sm"
        >
            <button
                on:click={() => (activeTab = "subscription")}
                class="w-1/2 rounded-full px-8 py-2 text-sm font-semibold transition-colors {activeTab ===
                'subscription'
                    ? 'bg-muted text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'}"
            >
                Subscription
            </button>
            <button
                on:click={() => (activeTab = "one_time")}
                class="w-1/2 rounded-full px-8 py-2 text-sm font-semibold transition-colors {activeTab ===
                'one_time'
                    ? 'bg-muted text-foreground shadow-sm'
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
                        class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:mx-auto lg:max-w-6xl"
                    >
                        {#each subscriptionPlans as plan, i (plan.price_id)}
                            <div
                                class="relative flex flex-col rounded-2xl border bg-background/50 p-8 text-center shadow-lg backdrop-blur-sm transition-all duration-300 {$authStore
                                    .user?.subscription_plan_name === plan.name
                                    ? 'border-primary shadow-primary/20'
                                    : 'border-border/50 hover:border-border hover:shadow-xl'}"
                            >
                                {#if $authStore.user?.subscription_plan_name === plan.name}
                                    <div
                                        class="absolute right-4 top-4 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                                    >
                                        Current Plan
                                    </div>
                                {/if}
                                <div class="flex-grow">
                                    <h3
                                        class="text-lg font-semibold text-foreground"
                                    >
                                        {plan.name}
                                    </h3>
                                    <p
                                        class="mt-2 text-sm text-muted-foreground"
                                    >
                                        {plan.description || " "}
                                    </p>
                                    <div
                                        class="mt-8 flex flex-col items-center justify-center"
                                    >
                                        <div
                                            class="flex items-center gap-2 font-mono text-4xl font-bold text-primary"
                                        >
                                            <Coins
                                                class="h-8 w-8 text-amber-500"
                                            />
                                            <span>{plan.coins}</span>
                                        </div>
                                        <p
                                            class="text-sm font-medium text-muted-foreground"
                                        >
                                            Coins per month
                                        </p>
                                    </div>
                                    <div
                                        class="mt-4 flex items-baseline justify-center gap-1"
                                    >
                                        <span
                                            class="text-3xl font-bold tracking-tight text-foreground"
                                        >
                                            {formatPrice(plan.price)}
                                        </span>
                                        <span
                                            class="text-sm text-muted-foreground"
                                            >/month</span
                                        >
                                    </div>
                                    <ul
                                        class="mx-auto mt-8 w-fit space-y-3 text-left text-sm text-muted-foreground"
                                    >
                                        {#each plan.features as feature}
                                            <li
                                                class="flex items-start gap-x-3"
                                            >
                                                <CheckCircle
                                                    class="h-5 w-5 flex-shrink-0 text-primary"
                                                />
                                                <span>{@html feature}</span>
                                            </li>
                                        {/each}
                                    </ul>
                                </div>

                                <div
                                    class="mt-10"
                                    title={$authStore.isAuthenticated &&
                                    $authStore.user?.subscription_status ===
                                        "active" &&
                                    $authStore.user?.subscription_plan_name !==
                                        plan.name
                                        ? "You already have an active subscription."
                                        : ""}
                                >
                                    <button
                                        on:click={() =>
                                            handleCheckout(
                                                plan.price_id,
                                                "subscription",
                                            )}
                                        disabled={!!redirectingPriceId ||
                                            ($authStore.isAuthenticated &&
                                                $authStore.user
                                                    ?.subscription_status ===
                                                    "active")}
                                        class="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg font-semibold ring-offset-background transition-colors focus-visible:outline-none disabled:opacity-50 {$authStore
                                            .user?.subscription_plan_name ===
                                        plan.name
                                            ? 'bg-primary text-primary-foreground cursor-default'
                                            : i === 1
                                              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                              : 'bg-foreground/5 text-foreground hover:bg-foreground/10'}"
                                    >
                                        {#if redirectingPriceId === plan.price_id}
                                            <Loader2
                                                class="h-5 w-5 animate-spin"
                                            />
                                            <span>Redirecting...</span>
                                        {:else if $authStore.user?.subscription_plan_name === plan.name}
                                            <span>Current Plan</span>
                                        {:else}
                                            <span>Get Started</span>
                                            <ArrowRight class="h-4 w-4" />
                                        {/if}
                                    </button>
                                </div>
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
                                class="flex flex-col justify-between rounded-2xl border border-border/50 bg-background/50 p-8 text-center shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-border hover:shadow-xl"
                            >
                                <div>
                                    <h3
                                        class="text-lg font-semibold text-foreground"
                                    >
                                        {pack.name}
                                    </h3>
                                    <p
                                        class="mt-2 text-sm text-muted-foreground"
                                    >
                                        One-time coin booster
                                    </p>
                                    <div
                                        class="mt-8 flex flex-col items-center justify-center"
                                    >
                                        <div
                                            class="flex items-center gap-2 font-mono text-4xl font-bold text-primary"
                                        >
                                            <Coins
                                                class="h-8 w-8 text-amber-500"
                                            />
                                            <span>{pack.coins}</span>
                                        </div>
                                        <p
                                            class="text-sm font-medium text-muted-foreground"
                                        >
                                            Coins
                                        </p>
                                    </div>
                                    <p
                                        class="mt-4 text-3xl font-bold tracking-tight text-foreground"
                                    >
                                        {formatPrice(pack.price)}
                                    </p>
                                </div>

                                <div
                                    class="mt-8"
                                    title={!$authStore.isAuthenticated ||
                                    ($authStore.user &&
                                        $authStore.user.subscription_status !==
                                            "active")
                                        ? "An active subscription is required to purchase boosters."
                                        : ""}
                                >
                                    <button
                                        on:click={() =>
                                            handleCheckout(
                                                pack.price_id,
                                                "payment",
                                            )}
                                        disabled={!!redirectingPriceId ||
                                            !$authStore.isAuthenticated ||
                                            ($authStore.user &&
                                                $authStore.user
                                                    .subscription_status !==
                                                    "active")}
                                        class="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-foreground text-background font-semibold ring-offset-background transition-colors hover:bg-foreground/90 focus-visible:outline-none disabled:opacity-50"
                                    >
                                        {#if redirectingPriceId === pack.price_id}
                                            <Loader2
                                                class="h-5 w-5 animate-spin"
                                            />
                                            <span>Redirecting...</span>
                                        {:else}
                                            <ShoppingCart class="h-4 w-4" />
                                            <span>Buy Now</span>
                                        {/if}
                                    </button>
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        {/if}
    </main>
</div>
