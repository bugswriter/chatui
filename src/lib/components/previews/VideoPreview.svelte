<!-- src/lib/components/previews/VideoPreview.svelte -->
<script lang="ts">
    // ✅ THE FIX: Declare that this component accepts a 'url' prop.
    export let url: string | undefined = undefined;
</script>

<div
    class="relative w-full max-w-sm overflow-hidden rounded-xl border border-border"
>
    <video src={url} controls class="block w-full" />
</div>
