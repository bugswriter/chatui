<script lang="ts">
    import { afterUpdate, tick } from "svelte";
    import type { Message } from "$lib/types";
    import MessageBubble from "./MessageBubble.svelte";
    import LoadingMessage from "./LoadingMessage.svelte";
    import { MessageSquare } from "lucide-svelte";

    export let messages: Message[] = [];
    export let isLoading: boolean = false;
    export let userName: string = "You";
    export let userAvatarUrl: string | null | undefined = undefined;

    let scrollContainer: HTMLDivElement;
    let shouldAutoScroll = true;

    async function scrollToBottom(force = false) {
        await tick();
        if ((shouldAutoScroll || force) && scrollContainer) {
            scrollContainer.scrollTo({
                top: scrollContainer.scrollHeight,
                behavior: "smooth",
            });
        }
    }

    afterUpdate(() => scrollToBottom());

    function handleScroll() {
        if (!scrollContainer) return;
        const threshold = 50;
        const isAtBottom =
            scrollContainer.scrollHeight -
                scrollContainer.scrollTop -
                scrollContainer.clientHeight <
            threshold;
        shouldAutoScroll = isAtBottom;
    }
</script>

<div
    bind:this={scrollContainer}
    on:scroll={handleScroll}
    class="h-full overflow-y-auto px-4"
>
    <div class="container mx-auto max-w-3xl py-6">
        {#if messages.length === 0}
            <div
                class="flex h-full flex-col items-center justify-center py-24 text-center"
            >
                <img
                    src="https://media.tenor.com/Jwq3k63p73sAAAAj/manidhaya.gif"
                    alt="Assistant animation"
                    class="w-36"
                />
                <h1
                    class="mt-6 text-4xl font-semibold tracking-tight text-foreground"
                >
                    Cherry Blossom
                </h1>
                <p class="mt-2 max-w-sm text-muted-foreground">
                    Start a conversation by typing a message below, or upload a
                    file to begin.
                </p>
            </div>
        {:else}
            <div class="flex flex-col gap-y-6">
                {#each messages as message (message.clientId || message.id)}
                    <MessageBubble
                        {message}
                        {userName}
                        {userAvatarUrl}
                        on:reattach
                        on:contentLoaded={() => scrollToBottom(true)}
                        on:viewImage
                    />
                {/each}

                {#if isLoading}
                    <div class="flex justify-start">
                        <LoadingMessage />
                    </div>
                {/if}
            </div>
        {/if}
    </div>
</div>
