<!-- src/lib/components/message/MessageContent.svelte -->
<script lang="ts">
    import { afterUpdate } from "svelte";
    import { marked } from "marked";
    import { markedHighlight } from "marked-highlight";
    import hljs from "highlight.js/lib/core";
    import javascript from "highlight.js/lib/languages/javascript";
    import python from "highlight.js/lib/languages/python";
    import bash from "highlight.js/lib/languages/bash";
    import typescript from "highlight.js/lib/languages/typescript";
    import json from "highlight.js/lib/languages/json";

    import type { Message, Agent } from "$lib/types";
    import { agentStore } from "$lib/stores/agentStore";
    import AgentPopover from "$lib/components/AgentPopover.svelte";

    export let message: Message;
    export let isUser: boolean;
    export let isCurrentlyStreaming: boolean;

    let contentElement: HTMLDivElement;
    let hoveredAgent: Agent | undefined = undefined;
    let hoveredAgentElement: HTMLElement | null = null;
    let parsedContent: string = "";

    // --- Markdown & Syntax Highlighting ---
    hljs.registerLanguage("javascript", javascript);
    hljs.registerLanguage("python", python);
    hljs.registerLanguage("bash", bash);
    hljs.registerLanguage("typescript", typescript);
    hljs.registerLanguage("json", json);

    marked.use(
        markedHighlight({
            langPrefix: "hljs language-",
            highlight(code, lang) {
                const language = hljs.getLanguage(lang) ? lang : "plaintext";
                return hljs.highlight(code, { language }).value;
            },
        }),
    );

    // --- Reactive Logic ---
    $: showCursor =
        isCurrentlyStreaming && message.content && message.content.length > 0;
    $: progressPercentage =
        message.progress && message.progress.total > 0
            ? (message.progress.progress / message.progress.total) * 100
            : 0;

    // Parse content whenever the message changes
    $: (async (content) => {
        let contentToParse = content || "";
        if ($agentStore.isInitialized) {
            contentToParse = contentToParse.replace(
                /@(\S+)/g,
                (match, agentName) => {
                    const agent = agentStore.findByName(agentName.trim());
                    if (agent) {
                        return `<span class="agent-tag" data-agent-name="${agent.name}">${match}</span>`;
                    }
                    return match;
                },
            );
        }
        parsedContent = await marked.parse(contentToParse, { breaks: true });
    })(message.content);

    // Add copy buttons to code blocks after the component updates
    afterUpdate(() => {
        if (!contentElement) return;
        contentElement.querySelectorAll("pre").forEach((block) => {
            if (block.querySelector(".copy-button")) return;
            const button = document.createElement("button");
            button.className =
                "copy-button absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-md border bg-muted text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-background hover:text-foreground";
            button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
            button.addEventListener("click", () => {
                const code = block.querySelector("code")?.innerText;
                if (code) {
                    navigator.clipboard.writeText(code);
                    button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>`;
                    setTimeout(() => {
                        button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
                    }, 2000);
                }
            });
            block.prepend(button);
        });
    });

    function handleMouseOver(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (target.classList.contains("agent-tag")) {
            const agentName = target.dataset.agentName;
            if (agentName) {
                hoveredAgent = agentStore.findByName(agentName.trim());
                hoveredAgentElement = target;
            }
        }
    }

    function handleMouseOut() {
        hoveredAgent = undefined;
        hoveredAgentElement = null;
    }
</script>

<AgentPopover agent={hoveredAgent} targetElement={hoveredAgentElement} />

<div
    bind:this={contentElement}
    class="relative rounded-xl px-3.5 py-2.5 text-sm shadow-sm"
    class:bg-primary={isUser}
    class:text-primary-foreground={isUser}
    class:bg-muted={!isUser}
    class:text-foreground={!isUser}
    on:mouseover={handleMouseOver}
    on:mouseout={handleMouseOut}
>
    <div class="prose">
        {#if message.progress}
            <div class="animated-progress-wrapper w-80 space-y-2">
                <p class="text-xs opacity-80">
                    {message.progress.message}
                </p>
                <div
                    class="h-1.5 w-full overflow-hidden rounded-full bg-background/20"
                >
                    <div
                        class="animated-progress h-1.5 rounded-full bg-background transition-all duration-300"
                        style="width: {progressPercentage}%"
                    />
                </div>
            </div>
        {:else if !message.content && isCurrentlyStreaming}
            <div class="flex items-center gap-1.5">
                <span
                    class="h-2 w-2 animate-bounce rounded-full bg-current/70"
                />
                <span
                    class="h-2 w-2 animate-bounce rounded-full bg-current/70 [animation-delay:0.2s]"
                />
                <span
                    class="h-2 w-2 animate-bounce rounded-full bg-current/70 [animation-delay:0.4s]"
                />
            </div>
        {:else}
            {@html parsedContent}
            {#if showCursor}<span class="inline-block animate-pulse">▋</span
                >{/if}
        {/if}
    </div>
</div>

<style>
    /* This contains all the styles that were in MessageBubble before */
    .prose {
        color: inherit;
        max-width: none;
        word-break: break-word;
    }
    .prose :global(p) {
        margin: 0 0 0.5rem 0;
    }
    .prose :global(p:last-child) {
        margin-bottom: 0;
    }
    .prose :global(ul),
    .prose :global(ol) {
        margin: 0.5rem 0;
        padding-left: 1.5rem;
    }
    .prose :global(hr) {
        border-color: hsl(var(--border) / 0.5);
        margin: 1rem 0;
    }
    .prose :global(strong) {
        color: inherit;
        font-weight: 600;
    }
    .prose :global(blockquote) {
        padding-left: 1em;
        border-left: 2px solid hsl(var(--border));
        color: hsl(var(--muted-foreground));
    }
    .prose :global(pre) {
        position: relative;
        font-family: monospace;
        background-color: hsl(var(--background) / 0.5);
        border: 1px solid hsl(var(--border));
        color: hsl(var(--foreground));
        border-radius: var(--radius-md);
        padding: 1rem;
        padding-top: 3rem;
        margin: 0.5rem 0;
        overflow-x: auto;
    }
    .prose :global(code:not(pre > code)) {
        background-color: hsl(var(--muted) / 0.7);
        padding: 0.2em 0.4em;
        border-radius: var(--radius-sm);
        font-size: 85%;
        border: 1px solid hsl(var(--border));
    }
    .prose :global(pre code) {
        background-color: transparent;
        padding: 0;
        border: none;
        font-size: 0.9em;
    }
    .prose :global(.agent-tag) {
        font-weight: 500;
        background-color: hsl(var(--primary) / 0.15);
        color: hsl(var(--primary));
        padding: 0.125rem 0.625rem;
        border-radius: 9999px;
        border: 1px solid hsl(var(--primary) / 0.2);
        cursor: pointer;
        transition:
            background-color 0.2s,
            border-color 0.2s;
        white-space: nowrap;
    }
    .prose :global(.agent-tag:hover) {
        background-color: hsl(var(--primary) / 0.25);
        border-color: hsl(var(--primary) / 0.3);
    }
    :global(.user-bubble) .prose :global(.agent-tag) {
        background-color: hsl(var(--primary-foreground) / 0.15);
        color: hsl(var(--primary-foreground));
        border-color: hsl(var(--primary-foreground) / 0.3);
    }
    :global(.user-bubble) .prose :global(.agent-tag:hover) {
        background-color: hsl(var(--primary-foreground) / 0.25);
        border-color: hsl(var(--primary-foreground) / 0.4);
    }
    .animated-progress-wrapper {
        position: relative;
        overflow: hidden;
        border-radius: var(--radius-lg);
    }
    .animated-progress-wrapper::after {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-radius: var(--radius-lg);
        box-shadow: 0 0 0 1px hsl(var(--primary) / 0.5);
        animation: snake-border 2s linear infinite;
    }
    .animated-progress::after {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        transform: translateX(-100%);
        background-image: linear-gradient(
            90deg,
            hsla(0, 0%, 100%, 0) 0,
            hsla(0, 0%, 100%, 0.2) 20%,
            hsla(0, 0%, 100%, 0.5) 60%,
            hsla(0, 0%, 100%, 0)
        );
        animation: shimmer 2s infinite;
    }
    @keyframes snake-border {
        0% {
            clip-path: polygon(0 0, 0 0, 0 100%, 0 100%);
        }
        25% {
            clip-path: polygon(0 0, 100% 0, 100% 0, 0 0);
        }
        50% {
            clip-path: polygon(100% 0, 100% 0, 100% 100%, 100% 100%);
        }
        75% {
            clip-path: polygon(100% 100%, 0 100%, 0 100%, 100% 100%);
        }
        100% {
            clip-path: polygon(0 100%, 0 100%, 0 0, 0 0);
        }
    }
</style>
