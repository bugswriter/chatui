<script lang="ts">
    import { onMount } from "svelte";
    import { agentStore } from "$lib/stores/agentStore";
    import { Loader2, AlertTriangle, Users, Briefcase, X } from "lucide-svelte"; // Added X for close icon
    // The agent store manages fetching and caching the agents list.
    // We just need to ensure it's initialized when this component mounts.

    onMount(() => {
        agentStore.initialize();
    }); // Reactive state derived from the store

    $: isLoading = !$agentStore.isInitialized && !$agentStore.error; // State for the description modal

    let showDescriptionModal = false;
    let selectedAgentDescription = "";
    let selectedAgentName = "";

    function openDescriptionModal(agent: {
        name: string;
        description: string;
    }) {
        selectedAgentName = agent.name;
        selectedAgentDescription = agent.description;
        showDescriptionModal = true;
    }

    function closeDescriptionModal() {
        showDescriptionModal = false;
        selectedAgentDescription = "";
        selectedAgentName = "";
    }
</script>

<div class="min-h-screen bg-background text-foreground">
    <main class="container mx-auto px-4 py-24 sm:py-32">
        <div class="mx-auto max-w-4xl text-center">
            <h1 class="text-4xl font-extrabold tracking-tight sm:text-6xl">
                Available Agents
            </h1>
            <p class="mt-4 text-lg text-muted-foreground">
                Explore the specialized AI agents available on the platform.
                Each agent is designed for a specific set of tasks.
            </p>
        </div>
        <div class="mt-16 mx-auto max-w-6xl">
            {#if isLoading}
                <div
                    class="flex items-center justify-center p-12 text-foreground"
                >
                    <Loader2 class="mr-3 h-8 w-8 animate-spin text-primary" />
                    <span class="text-lg">Loading agents...</span>
                </div>
            {:else if $agentStore.error}
                <div
                    class="mx-auto flex max-w-md items-center gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700"
                >
                    <AlertTriangle class="h-5 w-5 flex-shrink-0" />
                    <p>{$agentStore.error}</p>
                </div>
            {:else if $agentStore.agents.length === 0}
                <div class="p-12 text-center text-foreground">
                    <Users class="mx-auto mb-4 h-10 w-10 text-foreground/80" />
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
                            class="rounded-md border border-border bg-card p-6 shadow-lg transition-shadow hover:shadow-xl"
                        >
                            <div class="flex items-start gap-4">
                                <img
                                    src={agent.avatar}
                                    alt="{agent.name} avatar"
                                    class="h-14 w-14 flex-shrink-0 rounded-full object-cover border-2 border-border"
                                />
                                <div>
                                    <h2
                                        class="text-xl font-bold text-foreground"
                                    >
                                        {agent.name}
                                    </h2>
                                    <div
                                        class="mt-1 flex items-center text-sm text-primary"
                                    >
                                        <Briefcase class="h-4 w-4 mr-1" />
                                        <span class="capitalize font-medium"
                                            >{agent.role}</span
                                        >
                                    </div>
                                </div>
                            </div>
                            <div class="mt-4">
                                <p
                                    class="text-sm text-foreground/80 line-clamp-3"
                                >
                                    {agent.description}
                                </p>
                                {#if agent.description.length > 100}
                                    <button
                                        class="text-primary hover:underline text-sm mt-2 block"
                                        on:click={() =>
                                            openDescriptionModal(agent)}
                                    >
                                        Read More
                                    </button>
                                {/if}
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    </main>

    {#if showDescriptionModal}
        <div
            class="fixed inset-0 z-50 flex items-center justify-center bg-transparent bg-opacity-50 p-4"
            on:click|self={closeDescriptionModal}
        >
            <div
                class="relative bg-background w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                <button
                    class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                    on:click={closeDescriptionModal}
                    aria-label="Close"
                >
                    <X class="h-6 w-6" />
                </button>
                <h3
                    id="modal-title"
                    class="text-2xl font-bold text-foreground mb-4"
                >
                    {selectedAgentName} Description
                </h3>
                <p class="text-muted-foreground whitespace-pre-wrap">
                    {selectedAgentDescription}
                </p>
            </div>
        </div>
    {/if}
</div>

<style global>
    .line-clamp-3 {
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
</style>
