<!-- src/routes/dashboard/+page.svelte -->
<script lang="ts">
    import { onMount } from "svelte";
    import { get } from "svelte/store";
    import { uiStore } from "$lib/stores/uiStore";
    import { authStore } from "$lib/stores/authStore";
    import { authToken } from "$lib/stores/tokenStore";
    import {
        AlertTriangle,
        Coins,
        Download,
        ExternalLink,
        History,
        Loader2,
        ShieldCheck,
        ShieldX,
        UserCircle,
    } from "lucide-svelte";
    import { fade } from "svelte/transition";

    interface Transaction {
        id: string;
        type: string; // Added based on API response
        amount: number;
        description?: string | null; // Added based on API response
        currency?: string; // Made optional
        status?: "paid" | "open" | "failed" | "uncollectible"; // Made optional
        created: string;
        invoice_pdf?: string; // Made optional
    }

    let transactions: Transaction[] = [];
    let isLoadingTransactions = false;
    let error: string | null = null;
    let actionInProgress: "billing" | "cancel" | "reactivate" | null = null;

    let fileInput: HTMLInputElement;
    let isUploading = false;
    let uploadError: string | null = null;

    async function handleFileSelect(event: Event) {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];

        if (file) {
            isUploading = true;
            uploadError = null;
            try {
                await authStore.updateAvatar(file);
            } catch (err) {
                uploadError =
                    err instanceof Error ? err.message : "Upload failed.";
            } finally {
                isUploading = false;
            }
        }
    }

    async function fetchTransactions() {
        isLoadingTransactions = true;
        error = null;
        try {
            const token = get(authToken);
            if (!token) throw new Error("Authentication token not found.");

            const res = await fetch(
                "https://api.bugswriter.ai/api/v1/users/me/transactions",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(
                    errorData.detail || "Failed to fetch transactions.",
                );
            }
            transactions = await res.json();
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
        try {
            const token = get(authToken);
            if (!token) throw new Error("Authentication token not found.");

            const res = await fetch(
                "https://api.bugswriter.ai/api/v1/payments/customer-portal",
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

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(
                    errorData.detail || "Could not open billing portal.",
                );
            }

            const data = await res.json();
            window.location.href = data.url;
        } catch (e) {
            error =
                e instanceof Error ? e.message : "An unknown error occurred.";
        } finally {
            actionInProgress = null;
        }
    }

    async function handleCancelSubscription() {
        if (
            !confirm(
                "Are you sure you want to cancel? Your subscription will remain active until the end of the current billing period.",
            )
        )
            return;

        actionInProgress = "cancel";
        error = null;
        try {
            const token = get(authToken);
            if (!token) throw new Error("Authentication token not found.");

            const res = await fetch(
                "https://api.bugswriter.ai/api/v1/users/cancel-subscription",
                {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                },
            );

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(
                    errorData.detail || "Failed to cancel subscription.",
                );
            }

            await authStore.refreshUser(); // Refresh user to get updated subscription status
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
        try {
            const token = get(authToken);
            if (!token) throw new Error("Authentication token not found.");

            const res = await fetch(
                "https://api.bugswriter.ai/api/v1/users/reactivate-subscription",
                {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                },
            );

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(
                    errorData.detail || "Failed to reactivate subscription.",
                );
            }
            await authStore.refreshUser(); // Refresh user to get updated subscription status
        } catch (e) {
            error =
                e instanceof Error ? e.message : "An unknown error occurred.";
        } finally {
            actionInProgress = null;
        }
    }

    function formatDate(dateString: string) {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }

    $: statusInfo = (status: string) => {
        switch (status) {
            case "paid":
                return {
                    text: "Paid",
                    color: "bg-green-500/20 text-green-400 border-green-500/30",
                };
            case "open":
                return {
                    text: "Open",
                    color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
                };
            case "failed":
                return {
                    text: "Failed",
                    color: "bg-red-500/20 text-red-400 border-red-500/30",
                };
            case "uncollectible":
                return {
                    text: "Uncollectible",
                    color: "bg-gray-500/20 text-gray-400 border-gray-500/30",
                };
            default:
                return {
                    text: status.charAt(0).toUpperCase() + status.slice(1),
                    color: "bg-gray-500/20 text-gray-400 border-gray-500/30",
                };
        }
    };

    onMount(() => {
        if ($authStore.isAuthenticated) {
            fetchTransactions();
        }
    });

    $: if (!$authStore.isAuthenticated && !$authStore.isLoading) {
        // Handle case where user logs out on this page
        // Or if they land here without being authenticated
    }
</script>

<div class="min-h-screen bg-background text-foreground pt-16">
    <main class="container mx-auto px-4 py-12 sm:py-24">
        {#if $authStore.isAuthenticated && $authStore.user}
            <div class="mx-auto max-w-7xl">
                <header class="mb-12">
                    <h1
                        class="text-4xl font-bold tracking-tight text-foreground"
                    >
                        Dashboard
                    </h1>
                    <p class="mt-2 text-lg text-muted-foreground">
                        Manage your account, subscription, and view transaction
                        history.
                    </p>
                </header>

                {#if error}
                    <div
                        transition:fade
                        class="mb-8 flex items-center gap-3 rounded-lg border border-danger/50 bg-danger/10 p-4 text-sm text-danger"
                    >
                        <AlertTriangle class="h-5 w-5 flex-shrink-0" />
                        <p>{error}</p>
                    </div>
                {/if}

                <div class="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-12">
                    <!-- Left Column: Profile & Subscription -->
                    <div class="lg:col-span-1 space-y-8">
                        <!-- Profile Card -->
                        <div
                            class="rounded-xl border border-border bg-background shadow-sm"
                        >
                            <div class="border-b border-border p-4">
                                <h2 class="font-semibold text-foreground">
                                    Profile
                                </h2>
                            </div>
                            <div class="p-6">
                                <div class="flex items-center gap-4">
                                    <div
                                        class="relative h-16 w-16 flex-shrink-0"
                                    >
                                        {#if $authStore.user.avatar}
                                            <img
                                                src={$authStore.user.avatar}
                                                alt="User avatar"
                                                class="h-full w-full rounded-full object-cover"
                                            />
                                        {:else}
                                            <div
                                                class="flex h-full w-full items-center justify-center rounded-full bg-muted"
                                            >
                                                <UserCircle
                                                    class="h-10 w-10 text-muted-foreground"
                                                />
                                            </div>
                                        {/if}
                                        <input
                                            bind:this={fileInput}
                                            on:change={handleFileSelect}
                                            type="file"
                                            accept="image/*"
                                            hidden
                                        />
                                        <button
                                            on:click={() => fileInput.click()}
                                            disabled={isUploading}
                                            class="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity hover:opacity-100 focus:opacity-100"
                                            aria-label="Change profile picture"
                                        >
                                            {#if isUploading}
                                                <Loader2
                                                    class="h-5 w-5 animate-spin"
                                                />
                                            {:else}
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="20"
                                                    height="20"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    stroke-width="2"
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    ><path
                                                        d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"
                                                    ></path><circle
                                                        cx="12"
                                                        cy="13"
                                                        r="3"
                                                    ></circle></svg
                                                >
                                            {/if}
                                        </button>
                                    </div>
                                    <div class="min-w-0 flex-1">
                                        <p
                                            class="truncate font-semibold text-foreground"
                                        >
                                            {$authStore.user.name}
                                        </p>
                                        <p
                                            class="truncate text-sm text-muted-foreground"
                                        >
                                            {$authStore.user.email}
                                        </p>
                                    </div>
                                </div>
                                {#if uploadError}
                                    <p
                                        class="mt-4 text-center text-xs text-danger"
                                    >
                                        {uploadError}
                                    </p>
                                {/if}
                            </div>
                        </div>

                        <!-- Subscription Card -->
                        <div
                            class="rounded-xl border border-border bg-background shadow-sm"
                        >
                            <div class="border-b border-border p-4">
                                <h2 class="font-semibold text-foreground">
                                    Subscription
                                </h2>
                            </div>
                            <div class="p-6 space-y-4">
                                <div class="flex items-center justify-between">
                                    <span class="text-sm text-muted-foreground"
                                        >Status</span
                                    >
                                    <span
                                        class="text-sm font-semibold capitalize text-foreground"
                                        >{$authStore.user.subscription_status ||
                                            "N/A"}</span
                                    >
                                </div>
                                <div
                                    class="flex justify-between items-baseline"
                                >
                                    <span class="text-sm text-muted-foreground"
                                        >Current Plan</span
                                    >

                                    <span
                                        class="text-sm font-semibold capitalize text-foreground"
                                        >{$authStore.user.active_plan_name ||
                                            "None"}</span
                                    >
                                </div>

                                <div class="space-y-3 pt-4">
                                    <button
                                        on:click={handleManageBilling}
                                        disabled={actionInProgress !== null}
                                        class="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground font-medium ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none disabled:opacity-50"
                                    >
                                        {#if actionInProgress === "billing"}
                                            <Loader2
                                                class="h-4 w-4 animate-spin"
                                            /> Redirecting...
                                        {:else}
                                            <ExternalLink class="h-4 w-4" /> Manage
                                            Billing
                                        {/if}
                                    </button>

                                    {#if $authStore.user.subscription_status === "active"}
                                        <button
                                            on:click={handleCancelSubscription}
                                            disabled={actionInProgress !== null}
                                            class="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-danger/10 text-danger font-medium ring-offset-background transition-colors hover:bg-danger/20 focus-visible:outline-none disabled:opacity-50"
                                        >
                                            {#if actionInProgress === "cancel"}
                                                <Loader2
                                                    class="h-4 w-4 animate-spin"
                                                /> Canceling...
                                            {:else}
                                                <ShieldX class="h-4 w-4" /> Cancel
                                                Subscription
                                            {/if}
                                        </button>
                                    {:else if $authStore.user.subscription_status === "canceled"}
                                        <button
                                            on:click={handleReactivateSubscription}
                                            disabled={actionInProgress !== null}
                                            class="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-green-500/10 text-green-400 font-medium ring-offset-background transition-colors hover:bg-green-500/20 focus-visible:outline-none disabled:opacity-50"
                                        >
                                            {#if actionInProgress === "reactivate"}
                                                <Loader2
                                                    class="h-4 w-4 animate-spin"
                                                /> Reactivating...
                                            {:else}
                                                <ShieldCheck class="h-4 w-4" /> Reactivate
                                                Subscription
                                            {/if}
                                        </button>
                                    {/if}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Right Column: Transaction History -->
                    <div
                        class="lg:col-span-2 rounded-xl border border-border bg-background shadow-sm"
                    >
                        <div class="border-b border-border p-4">
                            <h2 class="font-semibold text-foreground">
                                Transaction History
                            </h2>
                        </div>
                        <div class="p-2">
                            {#if isLoadingTransactions}
                                <div
                                    class="flex h-96 flex-col items-center justify-center text-muted-foreground"
                                >
                                    <Loader2
                                        class="mb-3 h-8 w-8 animate-spin text-primary"
                                    />
                                    <p class="font-medium">
                                        Loading transactions...
                                    </p>
                                </div>
                            {:else if transactions.length === 0}
                                <div
                                    class="flex h-96 flex-col items-center justify-center text-muted-foreground"
                                >
                                    <History class="mb-4 h-12 w-12" />
                                    <p class="font-semibold">
                                        No Transactions Found
                                    </p>
                                    <p class="mt-1 text-sm">
                                        Your payment history will appear here.
                                    </p>
                                </div>
                            {:else}
                                <div class="h-96 overflow-y-auto">
                                    <table class="w-full text-sm">
                                        <thead
                                            class="sticky top-0 z-10 bg-background text-left"
                                        >
                                            <tr class="border-b border-border">
                                                <th
                                                    class="px-4 py-3 font-medium text-muted-foreground"
                                                    >Type</th
                                                >
                                                <th
                                                    class="px-4 py-3 font-medium text-muted-foreground"
                                                    >Description</th
                                                >
                                                <th
                                                    class="px-4 py-3 font-medium text-muted-foreground"
                                                    >Date</th
                                                >
                                                <th
                                                    class="px-4 py-3 font-medium text-muted-foreground text-right"
                                                    >Coins</th
                                                >
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {#each transactions as trx (trx.id)}
                                                {@const isCredit =
                                                    trx.type === "bonus" ||
                                                    trx.type === "refund"}
                                                <tr
                                                    class="border-b border-border/50 transition-colors hover:bg-muted/50"
                                                >
                                                    <td
                                                        class="px-4 py-3 font-medium capitalize"
                                                    >
                                                        {trx.type}
                                                    </td>
                                                    <td class="px-4 py-3">
                                                        {trx.description}
                                                    </td>
                                                    <td class="px-4 py-3">
                                                        {formatDate(
                                                            trx.created,
                                                        )}
                                                    </td>
                                                    <td
                                                        class="px-4 py-3 text-right"
                                                    >
                                                        <div
                                                            class="flex items-center justify-end gap-2 {isCredit
                                                                ? 'text-green-500'
                                                                : 'text-red-500'}"
                                                        >
                                                            <Coins
                                                                class="h-4 w-4"
                                                            />
                                                            <span
                                                                class="font-semibold"
                                                                >{isCredit
                                                                    ? "+"
                                                                    : "-"}{trx.amount}</span
                                                            >
                                                        </div>
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
            <!-- This state might occur if the user is logged out or session expires.
				 The layout's checks should ideally handle this, but this is a fallback. -->
            <div
                class="flex flex-col items-center justify-center h-[50vh] text-muted-foreground"
            >
                <p>Please log in to view your dashboard.</p>
            </div>
        {/if}
    </main>
</div>
