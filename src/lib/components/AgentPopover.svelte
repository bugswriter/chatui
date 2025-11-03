<script lang="ts">
    import { fade } from "svelte/transition";
    import type { Agent } from "$lib/types";
    import { browser } from "$app/environment"; // Import browser check

    export let agent: Agent | undefined = undefined;
    export let targetElement: HTMLElement | null = null;

    let top = 0;
    let left = 0;
    let opacity = 0;

    // This reactive block recalculates the popover's position.
    $: {
        // FIXED: Check if we are in the browser before accessing `window`.
        if (browser && agent && targetElement) {
            const rect = targetElement.getBoundingClientRect();
            // Position the popover above the target element, centered.
            top = rect.top + window.scrollY - 12;
            left = rect.left + window.scrollX + rect.width / 2;
            opacity = 1;
        } else {
            opacity = 0;
        }
    }
</script>

<!-- Markup remains the same -->
<div
    class="fixed z-50 w-full max-w-xs rounded-lg border border-border bg-background/80 shadow-2xl backdrop-blur-md transition-opacity duration-200"
    style="top: {top}px; left: {left}px; opacity: {opacity}; transform: translate(-50%, -100%); pointer-events: none;"
    transition:fade={{ duration: 150 }}
>
    {#if agent}
        <div class="flex items-start gap-4 p-4">
            <img
                src={agent.avatar}
                alt={agent.name}
                class="h-14 w-14 flex-shrink-0 object-cover border border-border"
            />
            <div class="min-w-0">
                <h3 class="font-bold text-foreground truncate">{agent.name}</h3>
                <p class="mt-1 text-sm text-muted-foreground leading-snug">
                    {agent.description}
                </p>
            </div>
        </div>
    {/if}
</div>
