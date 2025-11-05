<!-- src/routes/auth/callback/+page.svelte -->
<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { authToken } from "$lib/stores/tokenStore";
    import { authStore } from "$lib/stores/authStore"; // ✅ IMPORT authStore
    import { Loader2 } from "lucide-svelte";

    export let data: { token: string | null; error: string | null };

    onMount(async () => {
        if (data.error) {
            console.error("OAuth Callback Error:", data.error);
            goto("/");
        } else if (data.token) {
            console.log(
                "OAuth callback successful. Setting token and initializing session...",
            );

            // 1. Save the token. This synchronously updates localStorage.
            authToken.set(data.token);

            // 2. ✅ CRUCIAL FIX: Explicitly run the initialization process.
            // This function is the single source of truth for setting the
            // app's auth state. It will fetch user details and update the
            // authStore, making it immediately aware of the new user.
            await authStore.initialize();

            // 3. Now redirect to the homepage. The navbar and other components
            // will already be reacting to the updated store state from the step above.
            goto("/", { replaceState: true });
        } else {
            console.error("Callback page loaded without a token or error.");
            goto("/");
        }
    });
</script>

<!-- UI remains the same, providing feedback during the async operations -->
<div
    class="flex h-screen w-full flex-col items-center justify-center bg-white space-y-4"
>
    <Loader2 class="h-10 w-10 animate-spin text-blue-600" />
    <h1 class="text-xl font-semibold text-gray-800">Finalizing sign in...</h1>
    <p class="text-gray-500">Please wait, you will be redirected shortly.</p>
</div>
