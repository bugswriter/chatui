<!-- src/routes/dashboard/+page.svelte -->
<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { authStore } from "$lib/stores/authStore";
    import { API_CONFIG, getAuthToken } from "$lib/services/api";
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
        if ($authStore.isAuthenticated) await fetchTransactions();
    });

    async function fetchTransactions() {
        isLoadingTransactions = true;
        error = null;
        const token = getAuthToken();
        if (!token) return (isLoadingTransactions = false);
        try {
            const res = await fetch(
                `${API_CONFIG.authBaseUrl}/api/v1/users/me/transactions`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                },
            );
            if (!res.ok) throw new Error("Failed to load transaction history.");
            transactions = await res.json();
        } catch (e) {
            error = e instanceof Error ? e.message : "Unknown error.";
        } finally {
            isLoadingTransactions = false;
        }
    }

    async function handleManageBilling() {
        actionInProgress = "billing";
        error = null;
        const token = getAuthToken();
        try {
            const res = await fetch(
                `${API_CONFIG.authBaseUrl}/api/v1/payments/customer-portal`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ return_url: window.location.href }),
                },
            );
            if (!res.ok) throw new Error("Could not open billing portal.");
            const data = await res.json();
            window.location.href = data.url;
        } catch (e) {
            error = e instanceof Error ? e.message : "Unknown error.";
            actionInProgress = null;
        }
    }

    async function handleCancelSubscription() {
        if (
            !confirm(
                "Cancel subscription? It stays active until the current period ends.",
            )
        )
            return;
        actionInProgress = "cancel";
        const token = getAuthToken();
        try {
            const res = await fetch(
                `${API_CONFIG.authBaseUrl}/api/v1/payments/subscriptions/cancel`,
                {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                },
            );
            if (!res.ok) throw new Error("Failed to cancel subscription.");
            await authStore.refreshUserDetails();
        } catch (e) {
            error = e instanceof Error ? e.message : "Unknown error.";
        } finally {
            actionInProgress = null;
        }
    }

    async function handleReactivateSubscription() {
        actionInProgress = "reactivate";
        const token = getAuthToken();
        try {
            const res = await fetch(
                `${API_CONFIG.authBaseUrl}/api/v1/payments/subscriptions/reactivate`,
                {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                },
            );
            if (!res.ok) throw new Error("Failed to reactivate subscription.");
            await authStore.refreshUserDetails();
        } catch (e) {
            error = e instanceof Error ? e.message : "Unknown error.";
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
                return { text: "Past Due", color: "text-red-600" };
            default:
                return { text: "Inactive", color: "text-gray-400" };
        }
    })($authStore.user?.subscription_status);
</script>

<!-- UNIFIED DESIGN: Clean white background, standard shadow/border cards -->
<div class="min-h-screen bg-white text-gray-800">
    <main class="container mx-auto px-6 py-24 sm:py-32">
        {#if $authStore.isAuthenticated && $authStore.user}
            <div class="mx-auto max-w-6xl">
                <h1
                    class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-10"
                >
                    Dashboard
                </h1>

                {#if error}
                    <div
                        class="mt-4 flex items-center gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700"
                    >
                        <AlertTriangle class="h-5 w-5 flex-shrink-0" />
                        <p>{error}</p>
                    </div>
                {/if}

                <div class="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
                    <!-- Left Column -->
                    <div class="lg:col-span-1 space-y-8">
                        <!-- Account Card: UNIFIED DESIGN - Standardized card look -->
                        <div
                            class="rounded-2xl border border-gray-200 bg-white shadow-xl transition-shadow"
                        >
                            <div
                                class="flex items-center gap-3 border-b border-gray-100 p-4 bg-gray-50 rounded-t-2xl"
                            >
                                <UserCircle class="h-5 w-5 text-gray-500" />
                                <h2 class="font-semibold text-gray-900">
                                    Account
                                </h2>
                            </div>
                            <div class="p-6 flex items-center gap-4">
                                <img
                                    src={$authStore.user.avatar ||
                                        `https://api.dicebear.com/8.x/bottts/svg?seed=${$authStore.user.email}`}
                                    alt="Avatar"
                                    class="h-16 w-16 rounded-full object-cover border border-gray-200"
                                />
                                <div>
                                    <p class="font-semibold text-gray-800">
                                        {$authStore.user.name}
                                    </p>
                                    <p class="text-sm text-gray-500">
                                        {$authStore.user.email}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Subscription: UNIFIED DESIGN - Standardized card look -->
                        <div
                            class="rounded-2xl border border-gray-200 bg-white shadow-xl transition-shadow"
                        >
                            <div
                                class="flex items-center gap-3 border-b border-gray-100 p-4 bg-gray-50 rounded-t-2xl"
                            >
                                <CreditCard class="h-5 w-5 text-gray-500" />
                                <h2 class="font-semibold text-gray-900">
                                    Subscription
                                </h2>
                            </div>
                            <div class="p-6 space-y-4">
                                <div
                                    class="flex justify-between items-baseline"
                                >
                                    <span class="text-sm text-gray-500"
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
                                    <span class="text-sm text-gray-500"
                                        >Current Plan</span
                                    >
                                    <span class="font-semibold text-gray-800"
                                        >{$authStore.user.active_plan_name ||
                                            "None"}</span
                                    >
                                </div>
                                <div
                                    class="border-t border-gray-100 pt-4 space-y-3"
                                >
                                    <!-- Manage Billing: PRIMARY BUTTON - Standard blue -->
                                    <button
                                        on:click={handleManageBilling}
                                        disabled={!$authStore.user
                                            .stripe_customer_id ||
                                            !!actionInProgress}
                                        class="inline-flex h-10 w-full items-center justify-center rounded-lg bg-blue-600 text-white font-semibold text-sm transition hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {#if actionInProgress === "billing"}<Loader2
                                                class="mr-2 h-4 w-4 animate-spin"
                                            />{/if}
                                        Manage Billing
                                    </button>

                                    {#if $authStore.user.subscription_status === "active"}
                                        <!-- Cancel: DANGER BUTTON - Standard red -->
                                        <button
                                            on:click={handleCancelSubscription}
                                            disabled={!!actionInProgress}
                                            class="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 transition disabled:opacity-50"
                                        >
                                            {#if actionInProgress === "cancel"}<Loader2
                                                    class="h-4 w-4 animate-spin"
                                                />{:else}<ShieldX
                                                    class="h-4 w-4"
                                                />{/if}
                                            Cancel Subscription
                                        </button>
                                    {:else if $authStore.user.subscription_status === "canceled"}
                                        <!-- Reactivate: PRIMARY BUTTON - Standard blue -->
                                        <button
                                            on:click={handleReactivateSubscription}
                                            disabled={!!actionInProgress}
                                            class="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition disabled:opacity-50"
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

                    <!-- Right Column (Transaction History): UNIFIED DESIGN - Standardized card look -->
                    <div
                        class="lg:col-span-2 rounded-2xl border border-gray-200 bg-white shadow-xl transition-shadow"
                    >
                        <div
                            class="flex items-center gap-3 border-b border-gray-100 p-4 bg-gray-50 rounded-t-2xl"
                        >
                            <History class="h-5 w-5 text-gray-500" />
                            <h2 class="font-semibold text-gray-900">
                                Transaction History
                            </h2>
                        </div>
                        <div class="p-2">
                            {#if isLoadingTransactions}
                                <div
                                    class="flex justify-center items-center p-12"
                                >
                                    <Loader2
                                        class="h-6 w-6 animate-spin text-gray-400"
                                    />
                                </div>
                            {:else if transactions.length === 0}
                                <p class="p-12 text-center text-gray-500">
                                    No transactions found.
                                </p>
                            {:else}
                                <div class="overflow-x-auto">
                                    <table class="w-full text-sm text-gray-800">
                                        <thead
                                            class="text-left text-gray-500 bg-gray-50"
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
                                                    class="border-t border-gray-100 hover:bg-gray-50 transition"
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
                <Loader2 class="h-8 w-8 animate-spin text-gray-600" />
                <p class="mt-4 text-gray-500">Loading user data...</p>
            </div>
        {/if}
    </main>
</div>
