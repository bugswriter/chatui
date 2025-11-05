<script lang="ts">
    import type { Agent } from "$lib/types";

    export let agent: Agent | undefined = undefined;
    export let targetElement: HTMLElement | null = null;

    let top = 0;
    let left = 0;
    let opacity = 0;

    $: {
        if (agent && targetElement) {
            const rect = targetElement.getBoundingClientRect();
            top = rect.top + window.scrollY - 12; // 12px offset
            left = rect.left + window.scrollX + rect.width / 2;
            opacity = 1;
        } else {
            opacity = 0;
        }
    }
</script>

<div
    class="fixed z-50 w-72 rounded-xl border border-border bg-background/90 shadow-lg backdrop-blur-lg transition-opacity duration-150"
    style="top: {top}px; left: {left}px; opacity: {opacity}; transform: translate(-50%, -100%); pointer-events: none;"
>
    {#if agent}
        <div class="flex items-start gap-4 p-4">
            <img
                src={agent.avatar}
                alt={agent.name}
                class="h-12 w-12 flex-shrink-0 rounded-lg object-cover"
            />
            <div class="min-w-0">
                <h3 class="truncate font-semibold text-foreground">
                    {agent.name}
                </h3>
                <p class="mt-1 text-sm leading-snug text-muted-foreground">
                    {agent.description}
                </p>
            </div>
        </div>
    {/if}
</div>
