<!-- src/routes/agents/+page.svelte -->
<script lang="ts">
    import { onMount } from "svelte";
    import { agentStore } from "$lib/stores/agentStore";
    import { Loader2, AlertTriangle, Users } from "lucide-svelte";

    // The agent store manages fetching and caching the agents list.
    // We just need to ensure it's initialized when this component mounts.
    onMount(() => {
        agentStore.initialize();
    });

    // Reactive state derived from the store
    $: isLoading = !$agentStore.isInitialized && !$agentStore.error;
</script>

<!-- UNIFIED DESIGN: Use standard light background, clean colors, and primary blue -->
<div class="min-h-screen bg-gray-50 text-gray-900">
    <main class="container mx-auto px-4 py-24 sm:py-32">
        <!-- Header -->
        <div class="mx-auto max-w-4xl text-center">
            <h1 class="text-4xl font-extrabold tracking-tight sm:text-6xl">
                Available Agents
            </h1>
            <p class="mt-4 text-lg text-gray-600">
                Explore the specialized AI agents available on the platform.
                Each agent is designed for a specific set of tasks.
            </p>
        </div>

        <!-- Content Area: Card for the table -->
        <div class="mt-16 mx-auto max-w-4xl">
            {#if isLoading}
                <div
                    class="flex items-center justify-center p-12 text-gray-500"
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
                <div class="p-12 text-center text-gray-500">
                    <Users class="mx-auto mb-4 h-10 w-10 text-gray-300" />
                    <p class="font-semibold">No Agents Found</p>
                    <p class="mt-1 text-sm">
                        There are currently no agents available to display.
                    </p>
                </div>
            {:else}
                <!-- Table Container with a nice card style -->
                <div
                    class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
                >
                    <div class="overflow-x-auto">
                        <table
                            class="min-w-full divide-y divide-gray-200 text-sm"
                        >
                            <thead class="bg-gray-50">
                                <tr>
                                    <th
                                        scope="col"
                                        class="px-6 py-3 text-left font-medium uppercase tracking-wider text-gray-500"
                                    >
                                        Avatar
                                    </th>
                                    <th
                                        scope="col"
                                        class="px-6 py-3 text-left font-medium uppercase tracking-wider text-gray-500"
                                    >
                                        Name
                                    </th>
                                    <th
                                        scope="col"
                                        class="px-6 py-3 text-left font-medium uppercase tracking-wider text-gray-500"
                                    >
                                        Role
                                    </th>
                                    <th
                                        scope="col"
                                        class="px-6 py-3 text-left font-medium uppercase tracking-wider text-gray-500"
                                    >
                                        Description
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200 bg-white">
                                {#each $agentStore.agents as agent (agent.id)}
                                    <tr
                                        class="hover:bg-gray-50 transition-colors"
                                    >
                                        <td class="px-6 py-4">
                                            <img
                                                src={agent.avatar}
                                                alt="{agent.name} avatar"
                                                class="h-10 w-10 rounded-full object-cover"
                                            />
                                        </td>
                                        <td
                                            class="px-6 py-4 font-medium text-gray-900"
                                        >
                                            {agent.name}
                                        </td>
                                        <td
                                            class="px-6 py-4 text-gray-500 capitalize"
                                        >
                                            {agent.role}
                                        </td>
                                        <td
                                            class="px-6 py-4 text-gray-500 max-w-sm"
                                        >
                                            <p class="whitespace-normal">
                                                {agent.description}
                                            </p>
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                </div>
            {/if}
        </div>
    </main>
</div>
