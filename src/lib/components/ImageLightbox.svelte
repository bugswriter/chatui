<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { fade } from "svelte/transition";
    import { X } from "lucide-svelte";

    export let url: string | null;

    const dispatch = createEventDispatcher();

    function closeModal() {
        dispatch("close");
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "Escape") {
            closeModal();
        }
    }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if url}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-lg"
        on:click={closeModal}
        transition:fade={{ duration: 150 }}
        role="dialog"
        aria-modal="true"
    >
        <img
            src={url}
            alt="Fullscreen attachment preview"
            class="block max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            on:click|stopPropagation
        />

        <button
            class="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white/70 transition-colors hover:text-white"
            on:click={closeModal}
            aria-label="Close image view"
        >
            <X class="h-6 w-6" />
        </button>
    </div>
{/if}
