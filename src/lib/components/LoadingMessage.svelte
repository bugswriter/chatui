<script lang="ts">
    import { Bot } from "lucide-svelte";
    export let agentAvatar: string | undefined = undefined;
    export let agentName: string | undefined = undefined;
</script>

<div class="flex items-end gap-3">
    <!-- Avatar -->
    <div
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
    >
        {#if agentAvatar}
            <img
                src={agentAvatar}
                alt={agentName || "Agent"}
                class="h-full w-full rounded-full object-cover"
            />
        {:else}
            <Bot class="h-5 w-5" />
        {/if}
    </div>

    <!-- Bubble -->
    <div class="rounded-xl bg-muted px-4 py-3 text-foreground">
        <div class="flex items-center gap-1.5">
            <span class="h-2 w-2 animate-bounce rounded-full bg-current/70" />
            <span
                class="h-2 w-2 animate-bounce rounded-full bg-current/70 [animation-delay:0.2s]"
            />
            <span
                class="h-2 w-2 animate-bounce rounded-full bg-current/70 [animation-delay:0.4s]"
            />
        </div>
    </div>
</div>
