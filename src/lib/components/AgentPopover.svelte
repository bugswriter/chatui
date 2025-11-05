<!-- src/lib/components/AgentPopover.svelte -->
<script lang="ts">
    import { fade } from "svelte/transition";
    import type { Agent } from "$lib/types";

    export let agent: Agent | undefined = undefined;
    export let targetElement: HTMLElement | null = null;

    let top = 0;
    let left = 0;
    let opacity = 0;

    // This reactive block recalculates the popover's position
    // whenever the target element or the agent data changes.
    $: {
        if (agent && targetElement) {
            const rect = targetElement.getBoundingClientRect();
            // Position the popover above the target element, centered horizontally.
            top = rect.top + window.scrollY - 12; // 12px offset above the tag
            left = rect.left + window.scrollX + rect.width / 2;
            opacity = 1;
        } else {
            // Hide the popover when there's no agent or target
            opacity = 0;
        }
    }
</script>

{#if agent}
    <div
        class="fixed z-50 w-full max-w-sm rounded-xl border border-border bg-popover/80 p-4 shadow-xl backdrop-blur-lg transition-opacity duration-200"
        style="
            top: {top}px;
            left: {left}px;
            opacity: {opacity};
            transform: translate(-50%, -100%);
            pointer-events: none;
        "
        transition:fade={{ duration: 150 }}
        role="tooltip"
    >
        <div class="flex items-start gap-4">
            <img
                src={agent.avatar}
                alt={agent.name}
                class="h-14 w-14 flex-shrink-0 rounded-lg object-cover"
            />
            <div class="min-w-0">
                <h3
                    class="truncate text-lg font-semibold text-popover-foreground"
                >
                    {agent.name}
                </h3>
                <p class="mt-1 text-sm leading-snug text-muted-foreground">
                    {agent.description}
                </p>
            </div>
        </div>
    </div>
{/if}
