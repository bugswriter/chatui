<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { Attachment } from "$lib/types";
    import ActionBar from "./ActionBar.svelte";

    export let attachment: Attachment;
    export let url: string | undefined = undefined;

    const dispatch = createEventDispatcher();

    function forward(event: CustomEvent) {
        dispatch(event.type, event.detail);
    }
</script>

<button
    on:click={() => dispatch("viewImage", { url })}
    class="group relative block w-full cursor-zoom-in overflow-hidden rounded-xl border border-border text-left transition-shadow hover:shadow-md"
    aria-label="View image {attachment.filename} in fullscreen"
>
    <img
        src={url}
        alt={attachment.filename}
        class="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        on:load={() => dispatch("contentLoaded")}
    />

    <div
        class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
    />

    <div class="absolute bottom-0 left-0 w-full p-2">
        <ActionBar
            {attachment}
            {url}
            on:reattach={forward}
            on:download={forward}
        />
    </div>
</button>
