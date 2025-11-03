<!-- src/routes/dashboard/+page.svelte -->
<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { authStore } from "$lib/stores/authStore";
    import { API_CONFIG, getAuthToken } from "$lib/services/api";
    import Navbar from "$lib/components/Navbar.svelte";
    import {
        CreditCard,
        History,
        UserCircle,
        AlertTriangle,
        Loader2,
        ShieldCheck,
        ShieldX,
    } from "lucide-svelte";

    interface Transaction {
        id: string;
        type: string;
        amount: number;
        description: string;
        created: string;
    }

    let transactions: Transaction[] = [];
    let isLoadingTransactions = true;
    let error: string | null = null;
    let actionInProgress: "billing" | "cancel" | "reactivate" | null = null;

    // Redirect if not authenticated
    authStore.subscribe((state) => {
        if (
            typeof window !== "undefined" &&
            !state.isLoading &&
            !state.isAuthenticated
        ) {
            goto("/");
        }
    });

    onMount(async () => {
        if ($authStore.isAuthenticated) {
            await fetchTransactions();
        }
    });

    async function fetchTransactions() {
        isLoadingTransactions = true;
        error = null;
        const token = getAuthToken();
        if (!token) {
            isLoadingTransactions = false;
            return;
        }
        try {
            // ✅ FIX: Changed to use authBaseUrl for the transactions endpoint
            const response = await fetch(
                `${API_CONFIG.authBaseUrl}/api/v1/users/me/transactions`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                },
            );
            if (!response.ok)
                throw new Error("Failed to load transaction history.");
            transactions = await response.json();
        } catch (e) {
            error =
                e instanceof Error ? e.message : "An unknown error occurred.";
        } finally {
            isLoadingTransactions = false;
        }
    }

    async function handleManageBilling() {
        actionInProgress = "billing";
        error = null;
        const token = getAuthToken();
        try {
            const response = await fetch(
                `${API_CONFIG.authBaseUrl}/api/v1/payments/customer-portal`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        return_url: window.location.href,
                    }),
                },
            );
            if (!response.ok)
                throw new Error("Could not open the billing portal.");
            const data = await response.json();
            window.location.href = data.url;
        } catch (e) {
            error =
                e instanceof Error ? e.message : "An unknown error occurred.";
            actionInProgress = null;
        }
    }

    async function handleCancelSubscription() {
        if (
            !confirm(
                "Are you sure you want to cancel? Your plan will remain active until the end of the current billing period.",
            )
        )
            return;
        actionInProgress = "cancel";
        error = null;
        const token = getAuthToken();
        try {
            const response = await fetch(
                `${API_CONFIG.authBaseUrl}/api/v1/payments/subscriptions/cancel`,
                {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                },
            );
            if (!response.ok) throw new Error("Failed to cancel subscription.");
            await authStore.refreshUserDetails();
        } catch (e) {
            error =
                e instanceof Error ? e.message : "An unknown error occurred.";
        } finally {
            actionInProgress = null;
        }
    }

    async function handleReactivateSubscription() {
        actionInProgress = "reactivate";
        error = null;
        const token = getAuthToken();
        try {
            const response = await fetch(
                `${API_CONFIG.authBaseUrl}/api/v1/payments/subscriptions/reactivate`,
                {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                },
            );
            if (!response.ok)
                throw new Error("Failed to reactivate subscription.");
            await authStore.refreshUserDetails();
        } catch (e) {
            error =
                e instanceof Error ? e.message : "An unknown error occurred.";
        } finally {
            actionInProgress = null;
        }
    }

    function formatDate(dateString: string) {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    }

    $: statusInfo = ((status: string | null | undefined) => {
        switch (status) {
            case "active":
                return { text: "Active", color: "text-green-600" };
            case "canceled":
                return { text: "Canceled", color: "text-amber-600" };
            case "past_due":
                return { text: "Past Due", color: "text-destructive" };
            default:
                return { text: "Inactive", color: "text-muted-foreground" };
        }
    })($authStore.user?.subscription_status);
</script>

<div class="min-h-screen bg-muted/30 text-foreground">
    <Navbar />

    <main class="container mx-auto px-4 py-24 sm:py-32">
        {#if $authStore.isAuthenticated && $authStore.user}
            <div class="mx-auto max-w-5xl">
                <h1 class="text-3xl font-bold tracking-tight sm:text-4xl">
                    Dashboard
                </h1>

                {#if error}
                    <div
                        class="mt-6 flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
                    >
                        <AlertTriangle class="h-5 w-5 flex-shrink-0" />
                        <p>{error}</p>
                    </div>
                {/if}

                <div class="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
                    <!-- Left Column -->
                    <div class="lg:col-span-1 space-y-8">
                        <!-- Account Details -->
                        <div
                            class="rounded-xl border border-border bg-card text-card-foreground shadow-sm"
                        >
                            <div
                                class="flex items-center gap-3 border-b border-border p-4"
                            >
                                <UserCircle
                                    class="h-5 w-5 text-muted-foreground"
                                />
                                <h2 class="font-semibold">Account Details</h2>
                            </div>
                            <div class="p-6 flex items-center gap-4">
                                <img
                                    src={$authStore.user.avatar ||
                                        `https://api.dicebear.com/8.x/bottts/svg?seed=${$authStore.user.email}`}
                                    alt="User Avatar"
                                    class="h-16 w-16 rounded-full object-cover"
                                />
                                <div>
                                    <p class="font-semibold">
                                        {$authStore.user.name}
                                    </p>
                                    <p class="text-sm text-muted-foreground">
                                        {$authStore.user.email}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Subscription -->
                        <div
                            class="rounded-xl border border-border bg-card text-card-foreground shadow-sm"
                        >
                            <div
                                class="flex items-center gap-3 border-b border-border p-4"
                            >
                                <CreditCard
                                    class="h-5 w-5 text-muted-foreground"
                                />
                                <h2 class="font-semibold">Subscription</h2>
                            </div>
                            <div class="p-6 space-y-4">
                                <div
                                    class="flex justify-between items-baseline"
                                >
                                    <span class="text-sm text-muted-foreground"
                                        >Status</span
                                    >
                                    <span
                                        class="font-semibold capitalize {statusInfo.color}"
                                        >{statusInfo.text}</span
                                    >
                                </div>
                                <div
                                    class="flex justify-between items-baseline"
                                >
                                    <span class="text-sm text-muted-foreground"
                                        >Current Plan</span
                                    >
                                    <span class="font-semibold"
                                        >{$authStore.user.active_plan_name ||
                                            "None"}</span
                                    >
                                </div>
                                <div
                                    class="border-t border-border pt-4 space-y-3"
                                >
                                    <button
                                        on:click={handleManageBilling}
                                        disabled={!$authStore.user
                                            .stripe_customer_id ||
                                            !!actionInProgress}
                                        class="inline-flex h-10 w-full items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-sm transition-colors hover:bg-accent/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                                    >
                                        {#if actionInProgress === "billing"}<Loader2
                                                class="mr-2 h-4 w-4 animate-spin"
                                            />{/if}
                                        Manage Billing
                                    </button>
                                    {#if $authStore.user.subscription_status === "active"}
                                        <button
                                            on:click={handleCancelSubscription}
                                            disabled={!!actionInProgress}
                                            class="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive shadow-sm transition-colors hover:bg-destructive/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                                        >
                                            {#if actionInProgress === "cancel"}<Loader2
                                                    class="h-4 w-4 animate-spin"
                                                />{:else}<ShieldX
                                                    class="h-4 w-4"
                                                />{/if}
                                            Cancel Subscription
                                        </button>
                                    {:else if $authStore.user.subscription_status === "canceled"}
                                        <button
                                            on:click={handleReactivateSubscription}
                                            disabled={!!actionInProgress}
                                            class="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                                        >
                                            {#if actionInProgress === "reactivate"}<Loader2
                                                    class="h-4 w-4 animate-spin"
                                                />{:else}<ShieldCheck
                                                    class="h-4 w-4"
                                                />{/if}
                                            Reactivate Subscription
                                        </button>
                                    {/if}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Right Column -->
                    <div
                        class="lg:col-span-2 rounded-xl border border-border bg-card text-card-foreground shadow-sm"
                    >
                        <div
                            class="flex items-center gap-3 border-b border-border p-4"
                        >
                            <History class="h-5 w-5 text-muted-foreground" />
                            <h2 class="font-semibold">Transaction History</h2>
                        </div>
                        <div class="p-2">
                            {#if isLoadingTransactions}
                                <div
                                    class="flex justify-center items-center p-12"
                                >
                                    <Loader2
                                        class="h-6 w-6 animate-spin text-muted-foreground"
                                    />
                                </div>
                            {:else if transactions.length === 0}
                                <p
                                    class="p-12 text-center text-muted-foreground"
                                >
                                    No transactions found.
                                </p>
                            {:else}
                                <div class="overflow-x-auto">
                                    <table class="w-full text-sm">
                                        <thead
                                            class="text-left text-muted-foreground"
                                        >
                                            <tr>
                                                <th class="p-3 font-medium"
                                                    >Date</th
                                                >
                                                <th class="p-3 font-medium"
                                                    >Description</th
                                                >
                                                <th
                                                    class="p-3 font-medium text-right"
                                                    >Amount</th
                                                >
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {#each transactions as trx}
                                                <tr
                                                    class="border-t border-border"
                                                >
                                                    <td
                                                        class="p-3 whitespace-nowrap"
                                                        >{formatDate(
                                                            trx.created,
                                                        )}</td
                                                    >
                                                    <td class="p-3"
                                                        >{trx.description}</td
                                                    >
                                                    <td
                                                        class="p-3 text-right font-mono"
                                                        class:text-green-600={trx.amount >
                                                            0}
                                                        class:text-red-600={trx.amount <
                                                            0}
                                                    >
                                                        {trx.amount > 0
                                                            ? "+"
                                                            : ""}{trx.amount.toFixed(
                                                            0,
                                                        )}
                                                    </td>
                                                </tr>
                                            {/each}
                                        </tbody>
                                    </table>
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>
            </div>
        {:else if !$authStore.isLoading}
            <div
                class="flex h-[50vh] flex-col items-center justify-center text-center"
            >
                <Loader2 class="h-8 w-8 animate-spin text-primary" />
                <p class="mt-4 text-muted-foreground">Loading user data...</p>
            </div>
        {/if}
    </main>
</div>
