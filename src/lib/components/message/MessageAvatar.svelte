<!-- src/lib/components/message/MessageAvatar.svelte -->
<script lang="ts">
    import { Bot, User } from "lucide-svelte";
    import type { Agent } from "$lib/types";

    export let isUser: boolean;
    export let userAvatarUrl: string | null | undefined = undefined;
    export let userName: string = "You";
    export let agent: Partial<Agent> | null | undefined = undefined;
</script>

<div
    class="flex h-8 w-8 shrink-0 items-center justify-center self-end rounded-full bg-muted text-muted-foreground"
>
    {#if isUser}
        {#if userAvatarUrl}
            <img
                src={userAvatarUrl}
                alt={userName}
                class="h-full w-full rounded-full object-cover"
            />
        {:else}
            <User class="h-5 w-5" />
        {/if}
    {:else if agent?.avatar}
        <img
            src={agent.avatar}
            alt={agent.name}
            class="h-full w-full rounded-full object-cover"
        />
    {:else}
        <Bot class="h-5 w-5" />
    {/if}
</div>
