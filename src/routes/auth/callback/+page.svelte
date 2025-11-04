<!-- src/routes/auth/callback/+page.svelte -->
<script lang="ts">
    import { Loader2 } from "lucide-svelte";
</script>

<!-- UNIFIED DESIGN: Standard light background and primary spinner color -->
<div
    class="flex h-screen w-full flex-col items-center justify-center bg-white space-y-4"
>
    <Loader2 class="h-10 w-10 animate-spin text-blue-600" />
    <h1 class="text-xl font-semibold text-gray-800">Signing you in...</h1>
    <p class="text-gray-500">
        Please wait while we securely log you into your account.
    </p>
</div>
