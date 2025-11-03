<script lang="ts">
    import { afterUpdate, tick } from "svelte";
    import type { Message } from "$lib/types";
    import MessageBubble from "./MessageBubble.svelte";
    import LoadingMessage from "./LoadingMessage.svelte";

    export let messages: Message[] = [];
    export let isLoading: boolean = false;
    export let userName: string = "You";
    export let userAvatarUrl: string | null | undefined = undefined; // ✅ ACCEPT THE PROP HERE
    export let className: string = "";

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
        shouldAutoScroll =
            scrollContainer.scrollHeight -
                scrollContainer.scrollTop -
                scrollContainer.clientHeight <
            threshold;
    }
</script>

<div
    bind:this={scrollContainer}
    on:scroll={handleScroll}
    class="overflow-y-auto bg-gradient-to-b from-background/95 via-background/90 to-background/95 px-4 py-6 pt-18 {className}"
>
    <div class="mx-auto max-w-3xl">
        {#if messages.length === 0}
            <div
                class="flex flex-col items-center justify-center text-center py-24"
            >
                <img
                    src="https://i.pinimg.com/originals/31/38/c2/3138c2666fe9ffc47d4c56982c918a31.jpg"
                    alt="hannah"
                    class="h-32 w-32 rounded-full object-cover shadow-2xl shadow-primary/10 border-4 border-primary/50"
                />
                <h1 class="mt-8 text-4xl font-bold text-foreground">
                    Ready to Assist
                </h1>
                <p
                    class="mt-3 max-w-md text-base text-muted-foreground leading-relaxed"
                >
                    Start a conversation or upload files to begin. I'm here to
                    help with anything you need.
                </p>
            </div>
        {:else}
            <div class="flex flex-col gap-4">
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
                    <div class="flex justify-start mt-4">
                        <LoadingMessage />
                    </div>
                {/if}
            </div>
        {/if}
    </div>
</div>
