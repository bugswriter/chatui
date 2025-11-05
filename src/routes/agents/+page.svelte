<!-- src/routes/agents/+page.svelte -->
<script lang="ts">
    import { onMount } from "svelte";
    import { agentStore } from "$lib/stores/agentStore";
    import {
        Loader2,
        AlertTriangle,
        Users,
        Briefcase,
        X,
        Eye,
    } from "lucide-svelte";
    import { fade, scale } from "svelte/transition";
    import type { Agent } from "$lib/types";

    onMount(() => {
        agentStore.initialize();
    });

    $: isLoading = !$agentStore.isInitialized && !$agentStore.error;

    let showDescriptionModal = false;
    let selectedAgent: Agent | null = null;

    function openDescriptionModal(agent: Agent) {
        selectedAgent = agent;
        showDescriptionModal = true;
    }

    function closeDescriptionModal() {
        showDescriptionModal = false;
        selectedAgent = null;
    }

    function handleKeydown(event: KeyboardEvent) {
        if (showDescriptionModal && event.key === "Escape") {
            closeDescriptionModal();
        }
    }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="min-h-screen bg-background text-foreground pt-16">
    <main class="container mx-auto px-4 py-24 sm:py-32">
        <div class="mx-auto max-w-4xl text-center">
            <h1
                class="text-4xl font-bold tracking-tight text-foreground sm:text-6xl"
            >
                Available Agents
            </h1>
            <p class="mt-4 text-lg text-muted-foreground">
                Explore our specialized AI agents. Each one is fine-tuned for a
                unique set of tasks to enhance your workflow.
            </p>
        </div>
        <div class="mt-20 mx-auto max-w-7xl">
            {#if isLoading}
                <div
                    class="flex flex-col items-center justify-center p-12 text-muted-foreground"
                >
                    <Loader2 class="mb-3 h-8 w-8 animate-spin text-primary" />
                    <span class="text-lg font-medium">Loading Agents...</span>
                    <p class="text-sm">Just a moment, please.</p>
                </div>
            {:else if $agentStore.error}
                <div
                    class="mx-auto flex max-w-md flex-col items-center justify-center gap-3 rounded-lg border border-danger/50 bg-danger/10 p-6 text-center text-danger"
                >
                    <AlertTriangle class="h-8 w-8" />
                    <p class="font-semibold">Failed to load agents</p>
                    <p class="text-sm">{$agentStore.error}</p>
                </div>
            {:else if $agentStore.agents.length === 0}
                <div
                    class="p-12 text-center text-muted-foreground flex flex-col items-center"
                >
                    <Users class="mx-auto mb-4 h-12 w-12" />
                    <p class="font-semibold">No Agents Found</p>
                    <p class="mt-1 text-sm">
                        There are currently no agents available to display.
                    </p>
                </div>
            {:else}
                <div
                    class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
                >
                    {#each $agentStore.agents as agent (agent.id)}
                        <div
                            class="flex flex-col rounded-xl border border-border bg-background shadow-sm transition-all hover:border-primary/50 hover:shadow-lg"
                        >
                            <div class="p-6">
                                <div class="flex items-start gap-4">
                                    <img
                                        src={agent.avatar}
                                        alt="{agent.name} avatar"
                                        class="h-14 w-14 flex-shrink-0 rounded-full object-cover"
                                    />
                                    <div class="min-w-0">
                                        <h2
                                            class="text-lg font-semibold text-foreground"
                                        >
                                            {agent.name}
                                        </h2>
                                        <div
                                            class="mt-1 flex items-center text-sm font-medium text-primary"
                                        >
                                            <Briefcase class="h-4 w-4 mr-1.5" />
                                            <span class="capitalize"
                                                >{agent.role}</span
                                            >
                                        </div>
                                    </div>
                                </div>
                                <p
                                    class="mt-4 text-sm text-muted-foreground line-clamp-3"
                                >
                                    {agent.description}
                                </p>
                            </div>
                            <div
                                class="mt-auto border-t border-border bg-muted/30 p-4"
                            >
                                <button
                                    class="flex w-full items-center justify-center gap-2 rounded-md bg-muted px-4 py-2 text-sm font-medium text-foreground ring-offset-background transition-colors hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    on:click={() => openDescriptionModal(agent)}
                                >
                                    <Eye class="h-4 w-4" />
                                    <span>View Details</span>
                                </button>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    </main>

    {#if showDescriptionModal && selectedAgent}
        <!-- Backdrop -->
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div
            on:click={closeDescriptionModal}
            transition:fade={{ duration: 150 }}
            class="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
        />

        <!-- Modal -->
        <div
            transition:scale={{ duration: 150, start: 0.95 }}
            class="fixed top-1/2 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div
                class="relative flex flex-col rounded-xl border border-border bg-background shadow-2xl"
            >
                <div
                    class="flex items-start justify-between p-4 border-b border-border"
                >
                    <div class="flex items-center gap-3">
                        <img
                            src={selectedAgent.avatar}
                            alt=""
                            class="h-8 w-8 rounded-full object-cover"
                        />
                        <h3
                            id="modal-title"
                            class="text-lg font-semibold text-foreground"
                        >
                            {selectedAgent.name}
                        </h3>
                    </div>
                    <button
                        class="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        on:click={closeDescriptionModal}
                        aria-label="Close"
                    >
                        <X class="h-5 w-5" />
                    </button>
                </div>
                <div class="max-h-[60vh] overflow-y-auto p-6">
                    <p class="whitespace-pre-wrap text-muted-foreground">
                        {selectedAgent.description}
                    </p>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .line-clamp-3 {
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
</style>
