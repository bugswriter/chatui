<!-- src/lib/components/previews/ImagePreview.svelte -->
<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { Attachment } from "$lib/types";
    import ActionBar from "./ActionBar.svelte";

    export let attachment: Attachment;
    export let url: string | undefined = undefined;

    const dispatch = createEventDispatcher();

    let loaded = false;

    function forward(event: CustomEvent) {
        dispatch(event.type, event.detail);
    }

    // Reset loaded state if the URL changes
    $: if (url) {
        loaded = false;
    }
</script>

<!--
  ✅ THIS IS THE FIX FOR THE CLICK EVENT
  - `on:click`: The click handler is now on the main container `button`.
  - `z-0`: The image is placed at the base layer.
  - `z-10`: The overlays and action bar are placed on a higher layer.
  Because the click handler is on the parent, it will always fire, regardless
  of which child element (like the gradient overlay) is visually on top.
-->
<button
    on:click={() => dispatch("viewImage", { url })}
    class="group relative block w-full max-w-sm max-h-72 overflow-hidden rounded-xl border border-border text-left shadow-sm transition-shadow hover:shadow-md
    {loaded ? '' : 'animate-pulse bg-muted/50'} aspect-video"
    aria-label="View image {attachment.filename} in fullscreen"
>
    <img
        src={url}
        alt={attachment.filename}
        class="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] {loaded
            ? 'opacity-100'
            : 'opacity-0'} z-0"
        on:load={() => {
            loaded = true;
            dispatch("contentLoaded");
        }}
    />

    <!-- Overlays are positioned on top of the image -->
    <div
        class="absolute inset-0 z-10 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
    ></div>

    <div
        class="absolute bottom-0 left-0 z-10 w-full p-2 opacity-0 transition-opacity group-hover:opacity-100"
    >
        <ActionBar
            {attachment}
            {url}
            on:reattach={forward}
            on:download={forward}
        />
    </div>
</button>
