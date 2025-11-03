<script lang="ts">
    import { fade } from "svelte/transition";
    import type { Agent } from "$lib/types";
    import { browser } from "$app/environment";

    export let agent: Agent | undefined = undefined;
    export let targetElement: HTMLElement | null = null;

    let top = 0;
    let left = 0;
    let opacity = 0;

    // This reactive block recalculates the popover's position.
    $: {
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

<!-- UNIFIED DESIGN: Light background, subtle blur, standardized border/shadow -->
<div
    class="fixed z-50 w-full max-w-xs rounded-xl border border-gray-200 bg-white/80 shadow-xl backdrop-blur-md transition-opacity duration-200"
    style="top: {top}px; left: {left}px; opacity: {opacity}; transform: translate(-50%, -100%); pointer-events: none;"
    transition:fade={{ duration: 150 }}
>
    {#if agent}
        <div class="flex items-start gap-4 p-4">
            <img
                src={agent.avatar}
                alt={agent.name}
                class="h-14 w-14 flex-shrink-0 object-cover rounded-full border border-gray-100"
            />
            <div class="min-w-0">
                <h3 class="font-bold text-gray-900 truncate">{agent.name}</h3>
                <p class="mt-1 text-sm text-gray-600 leading-snug">
                    {agent.description}
                </p>
            </div>
        </div>
    {/if}
</div>
