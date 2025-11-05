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

<div
    class="group relative w-full overflow-hidden rounded-xl border border-border transition-shadow hover:shadow-md"
>
    <video src={url} controls class="block w-full" />

    <div
        class="absolute bottom-0 left-0 w-full p-2 opacity-0 transition-opacity group-hover:opacity-100"
    >
        <ActionBar
            {attachment}
            {url}
            on:reattach={forward}
            on:download={forward}
        />
    </div>
</div>
